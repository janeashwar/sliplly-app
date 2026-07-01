/**
 * Secure Logging Module — Sanitized logging (no sensitive data)
 * 
 * Wrapper around console.log/warn/error with data sanitization.
 * No-op in production (removes all logs).
 */

// ============================================
// TYPES
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  data?: any;
  source?: string;
}

export interface SanitizeConfig {
  enabled: boolean;
  sensitivePatterns: RegExp[];
  sensitiveKeys: string[];
  maskCharacter: string;
  maskLength: number;
}

export interface SecureLoggerConfig {
  isProduction: boolean;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  sanitize: SanitizeConfig;
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_SANITIZE_CONFIG: SanitizeConfig = {
  enabled: true,
  sensitivePatterns: [
    // Credit card numbers
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    // Social Security Numbers
    /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    // Email addresses
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    // Phone numbers
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    // IP addresses
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    // JWT tokens
    /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*/g,
    // API keys (common patterns)
    /\b[A-Za-z0-9]{32,}\b/g,
    // Bearer tokens
    /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
    // Authorization headers
    /Authorization:\s*[^\s]+/gi,
  ],
  sensitiveKeys: [
    'password',
    'passwd',
    'pwd',
    'secret',
    'token',
    'accesstoken',
    'access_token',
    'refreshtoken',
    'refresh_token',
    'apikey',
    'api_key',
    'api-key',
    'authorization',
    'auth',
    'credential',
    'credentials',
    'private_key',
    'privatekey',
    'ssn',
    'social_security',
    'credit_card',
    'creditcard',
    'card_number',
    'cardnumber',
    'cvv',
    'cvc',
    'pin',
    'otp',
    'verification_code',
    'verificationcode',
  ],
  maskCharacter: '*',
  maskLength: 8,
};

const DEFAULT_CONFIG: SecureLoggerConfig = {
  isProduction: !__DEV__,
  enableConsole: true,
  enableStorage: false,
  maxStorageEntries: 1000,
  sanitize: DEFAULT_SANITIZE_CONFIG,
};

// ============================================
// SECURE LOGGER CLASS
// ============================================

export class SecureLogger {
  private config: SecureLoggerConfig;
  private logBuffer: LogEntry[] = [];

  constructor(config?: Partial<SecureLoggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (config?.sanitize) {
      this.config.sanitize = { ...DEFAULT_SANITIZE_CONFIG, ...config.sanitize };
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any, source?: string): void {
    this.log('debug', message, data, source);
  }

  /**
   * Log info message
   */
  info(message: string, data?: any, source?: string): void {
    this.log('info', message, data, source);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any, source?: string): void {
    this.log('warn', message, data, source);
  }

  /**
   * Log error message
   */
  error(message: string, data?: any, source?: string): void {
    this.log('error', message, data, source);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, data?: any, source?: string): void {
    // No-op in production
    if (this.config.isProduction) {
      return;
    }

    // Sanitize message and data
    const sanitizedMessage = this.sanitize(message);
    const sanitizedData = data ? this.sanitize(data) : undefined;

    // Create log entry
    const entry: LogEntry = {
      level,
      timestamp: this.getTimestamp(),
      message: sanitizedMessage,
      data: sanitizedData,
      source,
    };

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }

    // Store in buffer if enabled
    if (this.config.enableStorage) {
      this.addToBuffer(entry);
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const formatted = this.formatEntry(entry);

    switch (entry.level) {
      case 'debug':
        console.log(formatted);
        break;
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  /**
   * Format log entry for output
   */
  private formatEntry(entry: LogEntry): string {
    const parts = [
      `[${entry.level.toUpperCase()}]`,
      `[${entry.timestamp}]`,
    ];

    if (entry.source) {
      parts.push(`[${entry.source}]`);
    }

    parts.push(entry.message);

    if (entry.data !== undefined) {
      const dataStr = typeof entry.data === 'string' 
        ? entry.data 
        : JSON.stringify(entry.data, null, 2);
      parts.push(`\n${dataStr}`);
    }

    return parts.join(' ');
  }

  /**
   * Get formatted timestamp
   */
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }

  /**
   * Sanitize data by removing sensitive information
   */
  sanitize(data: any): any {
    if (!this.config.sanitize.enabled) {
      return data;
    }

    // Handle strings
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    // Handle objects
    if (typeof data === 'object' && data !== null) {
      return this.sanitizeObject(data);
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }

    return data;
  }

  /**
   * Sanitize string by masking sensitive patterns
   */
  private sanitizeString(str: string): string {
    let sanitized = str;

    // Apply pattern masking
    this.config.sanitize.sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, this.mask());
    });

    return sanitized;
  }

  /**
   * Sanitize object by masking sensitive keys
   */
  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    const sanitized: any = {};

    Object.keys(obj).forEach(key => {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.config.sanitize.sensitiveKeys.some(
        sensitiveKey => lowerKey.includes(sensitiveKey)
      );

      if (isSensitive) {
        sanitized[key] = this.mask();
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = this.sanitize(obj[key]);
      } else if (typeof obj[key] === 'string') {
        sanitized[key] = this.sanitizeString(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    });

    return sanitized;
  }

  /**
   * Generate mask string
   */
  private mask(): string {
    return this.config.sanitize.maskCharacter.repeat(this.config.sanitize.maskLength);
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    // Trim buffer if too large
    if (this.logBuffer.length > this.config.maxStorageEntries) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxStorageEntries);
    }
  }

  /**
   * Get all buffered log entries
   */
  getBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Clear log buffer
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SecureLoggerConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.sanitize) {
      this.config.sanitize = { ...this.config.sanitize, ...config.sanitize };
    }
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return !this.config.isProduction;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let loggerInstance: SecureLogger | null = null;

export function getSecureLogger(config?: Partial<SecureLoggerConfig>): SecureLogger {
  if (!loggerInstance) {
    loggerInstance = new SecureLogger(config);
  }
  return loggerInstance;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Log debug message
 */
export function logDebug(message: string, data?: any, source?: string): void {
  getSecureLogger().debug(message, data, source);
}

/**
 * Log info message
 */
export function logInfo(message: string, data?: any, source?: string): void {
  getSecureLogger().info(message, data, source);
}

/**
 * Log warning message
 */
export function logWarn(message: string, data?: any, source?: string): void {
  getSecureLogger().warn(message, data, source);
}

/**
 * Log error message
 */
export function logError(message: string, data?: any, source?: string): void {
  getSecureLogger().error(message, data, source);
}

/**
 * Sanitize data without logging
 */
export function sanitizeData(data: any): any {
  return getSecureLogger().sanitize(data);
}

/**
 * Check if secure logging is enabled
 */
export function isLoggingEnabled(): boolean {
  return getSecureLogger().isEnabled();
}

export default {
  SecureLogger,
  getSecureLogger,
  logDebug,
  logInfo,
  logWarn,
  logError,
  sanitizeData,
  isLoggingEnabled,
};
