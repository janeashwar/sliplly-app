/**
 * API Client — Fetch-based with auth interceptor + offline-first caching
 *
 * Features:
 * - JWT token management (encrypted storage)
 * - Automatic token refresh
 * - Certificate pinning
 * - Offline-first: GET responses cached, write ops queued when offline
 * - Error handling
 */

import { encryptedStorage } from '../security/encryptedStorage';
import { certificatePinning } from '../security/certificatePinning';
import { cacheManager } from '../offline/cacheManager';
import { offlineQueue } from '../offline/offlineQueue';
import { networkMonitor } from '../offline/networkMonitor';

// API Base URL - change this to your server URL
const API_BASE_URL = 'https://sliplly.com/api/v1'; // Production

// Storage keys (stored in SecureStore - hardware-backed encryption)
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Token management using encrypted secure storage
export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await encryptedStorage.getSecure(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await encryptedStorage.getSecure(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      // Store in SecureStore (hardware-backed encryption)
      await encryptedStorage.setSecure(ACCESS_TOKEN_KEY, accessToken);
      await encryptedStorage.setSecure(REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await encryptedStorage.removeSecure(ACCESS_TOKEN_KEY);
      await encryptedStorage.removeSecure(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },
};

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Refresh token function
async function refreshAccessToken(): Promise<string> {
  const refreshToken = await tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  // Use certificate-pinned fetch
  const response = await certificatePinning.secureFetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Refresh failed');
  }

  const data = await response.json();
  await tokenStorage.setTokens(data.accessToken, data.refreshToken || refreshToken);

  return data.accessToken;
}

/**
 * Main fetch function with auth, certificate pinning, and offline caching.
 *
 * - GET requests: cached automatically, served from cache when offline
 * - Write requests (POST/PUT/PATCH/DELETE): queued when offline
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isRead = method === 'GET';

  // For GET requests: try cache first when offline
  if (isRead && !networkMonitor.isOnline) {
    const cached = await cacheManager.get<T>(endpoint);
    if (cached) {
      return cached.data;
    }
    throw new Error('No cached data available offline');
  }

  // For write requests when offline: queue and return optimistic response
  if (!isRead && !networkMonitor.isOnline) {
    await offlineQueue.enqueue({
      endpoint,
      method: method as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      body: options.body ? JSON.parse(options.body as string) : undefined,
      tag: endpoint.split('/')[1], // e.g., 'bookings', 'profile
    });

    // Return a queued indicator (callers should handle this)
    return { _queued: true, _message: 'Operation queued for sync when online' } as any as T;
  }

  // Online: proceed with normal fetch
  let token = await tokenStorage.getAccessToken();

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Use certificate-pinned fetch
  let response = await certificatePinning.secureFetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401, try to refresh token
  if (response.status === 401 && !isRefreshing) {
    isRefreshing = true;

    try {
      // Use existing refresh promise or create new one
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken();
      }

      token = await refreshPromise;
      refreshPromise = null;

      // Retry original request with new token
      headers['Authorization'] = `Bearer ${token}`;
      response = await certificatePinning.secureFetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (error) {
      // Refresh failed - clear tokens
      await tokenStorage.clearTokens();
      throw new Error('Authentication failed');
    } finally {
      isRefreshing = false;
    }
  }

  // Handle errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  // Parse response
  const data = await response.json();

  // Server wraps responses in { success, data, message } — unwrap it
  const unwrapped = data.data !== undefined ? data.data : data;

  // Cache GET responses
  if (isRead) {
    await cacheManager.set(endpoint, unwrapped);
  }

  // Invalidate related cache entries on write operations
  if (!isRead) {
    const resource = endpoint.split('?')[0]; // strip query params
    // Invalidate cache for the same resource (e.g., POST /trips invalidates GET /trips)
    const lastSlash = resource.lastIndexOf('/');
    const prefix = lastSlash > 0 ? resource.substring(0, lastSlash) : resource;
    await cacheManager.invalidateByPrefix(prefix);
  }

  return unwrapped as T;
}

// API methods
export const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'DELETE' }),
};

/**
 * Initialize offline systems. Call this once on app start.
 */
export async function initializeOfflineSystems(): Promise<void> {
  // Start network monitoring
  networkMonitor.initialize();

  // Initialize offline queue with executor that uses the API client
  await offlineQueue.initialize(async (op) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = await tokenStorage.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await certificatePinning.secureFetch(`${API_BASE_URL}${op.endpoint}`, {
      method: op.method,
      headers,
      body: op.body ? JSON.stringify(op.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }

    return response.json();
  });

  // Evict old cache entries (keep under 5MB)
  await cacheManager.evict(5 * 1024 * 1024);
}

export default api;
