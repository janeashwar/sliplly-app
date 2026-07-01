/**
 * Rate Limiter Module — Client-side request throttling
 * 
 * Prevents abuse by limiting requests per endpoint and globally.
 * Protects against brute force and DoS attacks.
 */

// ============================================
// TYPES
// ============================================

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number; // seconds
  remaining: number;
  limit: number;
  resetAt: number; // timestamp
}

export interface RateLimitConfig {
  globalMaxRequests: number;      // Max requests per minute globally
  globalWindowMs: number;         // Window duration in ms
  authMaxRequests: number;        // Max requests per second for auth
  authWindowMs: number;           // Window duration in ms
  endpointLimits: Record<string, {
    maxRequests: number;
    windowMs: number;
  }>;
}

interface RequestRecord {
  timestamps: number[];
  lastCleanup: number;
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_CONFIG: RateLimitConfig = {
  globalMaxRequests: 30,          // 30 requests per minute
  globalWindowMs: 60 * 1000,     // 1 minute
  authMaxRequests: 5,            // 5 requests per second
  authWindowMs: 1000,            // 1 second
  endpointLimits: {
    '/auth/login': { maxRequests: 5, windowMs: 1000 },
    '/auth/register': { maxRequests: 3, windowMs: 1000 },
    '/auth/forgot-password': { maxRequests: 2, windowMs: 60 * 1000 },
    '/auth/verify': { maxRequests: 10, windowMs: 60 * 1000 },
  },
};

// ============================================
// RATE LIMITER CLASS
// ============================================

export class RateLimiter {
  private config: RateLimitConfig;
  private globalRequests: RequestRecord;
  private endpointRequests: Map<string, RequestRecord>;
  private authEndpoints: Set<string>;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.globalRequests = { timestamps: [], lastCleanup: Date.now() };
    this.endpointRequests = new Map();
    this.authEndpoints = new Set([
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/verify',
      '/auth/refresh',
    ]);
  }

  /**
   * Check if request is allowed
   */
  check(endpoint: string): RateLimitResult {
    const now = Date.now();
    
    // Clean up old records periodically
    this.cleanup(now);

    // Check global rate limit
    const globalResult = this.checkGlobalLimit(now);
    if (!globalResult.allowed) {
      return globalResult;
    }

    // Check endpoint-specific limit
    const endpointResult = this.checkEndpointLimit(endpoint, now);
    if (!endpointResult.allowed) {
      return endpointResult;
    }

    // Check auth-specific limit for auth endpoints
    if (this.isAuthEndpoint(endpoint)) {
      const authResult = this.checkAuthLimit(endpoint, now);
      if (!authResult.allowed) {
        return authResult;
      }
    }

    // Record the request
    this.recordRequest(endpoint, now);

    return {
      allowed: true,
      retryAfter: 0,
      remaining: this.getRemainingRequests(endpoint),
      limit: this.getLimit(endpoint),
      resetAt: this.getResetTime(endpoint),
    };
  }

  /**
   * Check global rate limit (30 requests per minute)
   */
  private checkGlobalLimit(now: number): RateLimitResult {
    const windowStart = now - this.config.globalWindowMs;
    const recentRequests = this.globalRequests.timestamps.filter(
      ts => ts > windowStart
    );

    if (recentRequests.length >= this.config.globalMaxRequests) {
      const oldestInWindow = recentRequests[0];
      const retryAfter = Math.ceil((oldestInWindow + this.config.globalWindowMs - now) / 1000);
      
      return {
        allowed: false,
        retryAfter: Math.max(1, retryAfter),
        remaining: 0,
        limit: this.config.globalMaxRequests,
        resetAt: oldestInWindow + this.config.globalWindowMs,
      };
    }

    return { allowed: true, retryAfter: 0, remaining: 0, limit: 0, resetAt: 0 };
  }

  /**
   * Check endpoint-specific rate limit
   */
  private checkEndpointLimit(endpoint: string, now: number): RateLimitResult {
    const endpointConfig = this.config.endpointLimits[endpoint];
    if (!endpointConfig) {
      return { allowed: true, retryAfter: 0, remaining: 0, limit: 0, resetAt: 0 };
    }

    const record = this.getOrCreateRecord(endpoint);
    const windowStart = now - endpointConfig.windowMs;
    const recentRequests = record.timestamps.filter(ts => ts > windowStart);

    if (recentRequests.length >= endpointConfig.maxRequests) {
      const oldestInWindow = recentRequests[0];
      const retryAfter = Math.ceil((oldestInWindow + endpointConfig.windowMs - now) / 1000);

      return {
        allowed: false,
        retryAfter: Math.max(1, retryAfter),
        remaining: 0,
        limit: endpointConfig.maxRequests,
        resetAt: oldestInWindow + endpointConfig.windowMs,
      };
    }

    return { allowed: true, retryAfter: 0, remaining: 0, limit: 0, resetAt: 0 };
  }

  /**
   * Check auth-specific rate limit (5 requests per second)
   */
  private checkAuthLimit(endpoint: string, now: number): RateLimitResult {
    const record = this.getOrCreateRecord(`auth:${endpoint}`);
    const windowStart = now - this.config.authWindowMs;
    const recentRequests = record.timestamps.filter(ts => ts > windowStart);

    if (recentRequests.length >= this.config.authMaxRequests) {
      const oldestInWindow = recentRequests[0];
      const retryAfter = Math.ceil((oldestInWindow + this.config.authWindowMs - now) / 1000);

      return {
        allowed: false,
        retryAfter: Math.max(1, retryAfter),
        remaining: 0,
        limit: this.config.authMaxRequests,
        resetAt: oldestInWindow + this.config.authWindowMs,
      };
    }

    return { allowed: true, retryAfter: 0, remaining: 0, limit: 0, resetAt: 0 };
  }

  /**
   * Record a request timestamp
   */
  private recordRequest(endpoint: string, now: number): void {
    // Record globally
    this.globalRequests.timestamps.push(now);

    // Record for endpoint
    const record = this.getOrCreateRecord(endpoint);
    record.timestamps.push(now);

    // Record for auth if applicable
    if (this.isAuthEndpoint(endpoint)) {
      const authRecord = this.getOrCreateRecord(`auth:${endpoint}`);
      authRecord.timestamps.push(now);
    }
  }

  /**
   * Check if endpoint is an auth endpoint
   */
  private isAuthEndpoint(endpoint: string): boolean {
    return this.authEndpoints.has(endpoint) || endpoint.startsWith('/auth/');
  }

  /**
   * Get or create request record for endpoint
   */
  private getOrCreateRecord(endpoint: string): RequestRecord {
    let record = this.endpointRequests.get(endpoint);
    if (!record) {
      record = { timestamps: [], lastCleanup: Date.now() };
      this.endpointRequests.set(endpoint, record);
    }
    return record;
  }

  /**
   * Get remaining requests for endpoint
   */
  private getRemainingRequests(endpoint: string): number {
    const now = Date.now();
    const endpointConfig = this.config.endpointLimits[endpoint];
    
    if (!endpointConfig) {
      return this.config.globalMaxRequests - this.getRecentGlobalCount(now);
    }

    const record = this.getOrCreateRecord(endpoint);
    const windowStart = now - endpointConfig.windowMs;
    const recentRequests = record.timestamps.filter(ts => ts > windowStart).length;
    
    return endpointConfig.maxRequests - recentRequests;
  }

  /**
   * Get limit for endpoint
   */
  private getLimit(endpoint: string): number {
    const endpointConfig = this.config.endpointLimits[endpoint];
    return endpointConfig?.maxRequests || this.config.globalMaxRequests;
  }

  /**
   * Get reset time for endpoint
   */
  private getResetTime(endpoint: string): number {
    const now = Date.now();
    const endpointConfig = this.config.endpointLimits[endpoint];
    
    if (!endpointConfig) {
      return now + this.config.globalWindowMs;
    }

    const record = this.getOrCreateRecord(endpoint);
    if (record.timestamps.length === 0) {
      return now + endpointConfig.windowMs;
    }

    const oldest = record.timestamps[0];
    return oldest + endpointConfig.windowMs;
  }

  /**
   * Get recent global request count
   */
  private getRecentGlobalCount(now: number): number {
    const windowStart = now - this.config.globalWindowMs;
    return this.globalRequests.timestamps.filter(ts => ts > windowStart).length;
  }

  /**
   * Cleanup old records
   */
  private cleanup(now: number): void {
    const cleanupInterval = 60 * 1000; // Cleanup every minute
    
    // Cleanup global records
    if (now - this.globalRequests.lastCleanup > cleanupInterval) {
      const windowStart = now - this.config.globalWindowMs;
      this.globalRequests.timestamps = this.globalRequests.timestamps.filter(
        ts => ts > windowStart
      );
      this.globalRequests.lastCleanup = now;
    }

    // Cleanup endpoint records
    this.endpointRequests.forEach((record, endpoint) => {
      if (now - record.lastCleanup > cleanupInterval) {
        const windowStart = now - this.config.globalWindowMs;
        record.timestamps = record.timestamps.filter(ts => ts > windowStart);
        record.lastCleanup = now;
      }
    });
  }

  /**
   * Reset all rate limit data
   */
  reset(): void {
    this.globalRequests = { timestamps: [], lastCleanup: Date.now() };
    this.endpointRequests.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(config?: Partial<RateLimitConfig>): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter(config);
  }
  return rateLimiterInstance;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Check if a request to endpoint is allowed
 */
export function checkRateLimit(endpoint: string): RateLimitResult {
  return getRateLimiter().check(endpoint);
}

/**
 * Wrapper for fetch with rate limiting
 */
export async function rateLimitedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Extract endpoint from URL
  const endpoint = new URL(url).pathname;
  
  // Check rate limit
  const result = checkRateLimit(endpoint);
  
  if (!result.allowed) {
    throw new Error(`Rate limit exceeded. Retry after ${result.retryAfter} seconds.`);
  }

  // Add rate limit headers
  const headers = {
    ...options.headers,
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Limit': result.limit.toString(),
  };

  return fetch(url, { ...options, headers });
}

/**
 * Check multiple endpoints at once
 */
export function checkMultipleEndpoints(endpoints: string[]): Map<string, RateLimitResult> {
  const limiter = getRateLimiter();
  const results = new Map<string, RateLimitResult>();
  
  endpoints.forEach(endpoint => {
    results.set(endpoint, limiter.check(endpoint));
  });
  
  return results;
}

export default {
  RateLimiter,
  getRateLimiter,
  checkRateLimit,
  rateLimitedFetch,
  checkMultipleEndpoints,
};
