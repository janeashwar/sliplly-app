/**
 * Cache Manager — Offline-first API response caching
 *
 * Caches GET responses in AsyncStorage with TTL.
 * Serves cached data when offline, refreshes when back online.
 * Cache keys are derived from the API endpoint + params.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@sliplly_cache_';
const CACHE_META_PREFIX = '@sliplly_cache_meta_';

// Default TTL: 15 minutes
const DEFAULT_TTL_MS = 15 * 60 * 1000;

// Stale-while-revalidate window: serve stale for up to 24h
const STALE_TTL_MS = 24 * 60 * 60 * 1000;

export interface CacheEntry<T = any> {
  data: T;
  cachedAt: number;
  etag?: string;
}

export interface CacheMeta {
  key: string;
  cachedAt: number;
  ttl: number;
  endpoint: string;
  size: number; // rough byte estimate
}

function buildCacheKey(endpoint: string, params?: Record<string, any>): string {
  const paramStr = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
  // Simple hash for cache key
  let hash = 0;
  const str = endpoint + paramStr;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return `api_${Math.abs(hash).toString(36)}`;
}

class CacheManager {
  /**
   * Get cached data for an endpoint.
   * Returns null if not cached, expired beyond stale window, or on error.
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<CacheEntry<T> | null> {
    try {
      const key = buildCacheKey(endpoint, params);
      const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      const age = Date.now() - entry.cachedAt;

      // Beyond stale window — discard
      if (age > STALE_TTL_MS) {
        await this.remove(endpoint, params);
        return null;
      }

      return entry;
    } catch {
      return null;
    }
  }

  /**
   * Check if cached data is fresh (within TTL).
   */
  async isFresh(endpoint: string, params?: Record<string, any>): Promise<boolean> {
    const entry = await this.get(endpoint, params);
    if (!entry) return false;
    return (Date.now() - entry.cachedAt) < DEFAULT_TTL_MS;
  }

  /**
   * Store data in cache.
   */
  async set<T>(
    endpoint: string,
    data: T,
    params?: Record<string, any>,
    ttl: number = DEFAULT_TTL_MS,
    etag?: string,
  ): Promise<void> {
    try {
      const key = buildCacheKey(endpoint, params);
      const entry: CacheEntry<T> = {
        data,
        cachedAt: Date.now(),
        etag,
      };

      const serialized = JSON.stringify(entry);
      await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, serialized);

      // Store metadata for cache management
      const meta: CacheMeta = {
        key,
        cachedAt: Date.now(),
        ttl,
        endpoint,
        size: serialized.length,
      };
      await AsyncStorage.setItem(`${CACHE_META_PREFIX}${key}`, JSON.stringify(meta));
    } catch (e) {
      console.warn('[CacheManager] set error:', e);
    }
  }

  /**
   * Remove cached data for an endpoint.
   */
  async remove(endpoint: string, params?: Record<string, any>): Promise<void> {
    try {
      const key = buildCacheKey(endpoint, params);
      await AsyncStorage.multiRemove([`${CACHE_PREFIX}${key}`, `${CACHE_META_PREFIX}${key}`]);
    } catch (e) {
      console.warn('[CacheManager] remove error:', e);
    }
  }

  /**
   * Invalidate all caches matching a prefix (e.g., '/trips' invalidates all trip-related caches).
   */
  async invalidateByPrefix(endpointPrefix: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const metaKeys = keys.filter(k => k.startsWith(CACHE_META_PREFIX));

      // Read all metadata to find matching endpoints
      const entries = await AsyncStorage.multiGet(metaKeys);
      const toRemove: string[] = [];

      for (const [metaKey, metaRaw] of entries) {
        if (!metaRaw) continue;
        const meta: CacheMeta = JSON.parse(metaRaw);
        if (meta.endpoint.startsWith(endpointPrefix)) {
          toRemove.push(`${CACHE_PREFIX}${meta.key}`);
          toRemove.push(metaKey);
        }
      }

      if (toRemove.length > 0) {
        await AsyncStorage.multiRemove(toRemove);
      }
    } catch (e) {
      console.warn('[CacheManager] invalidateByPrefix error:', e);
    }
  }

  /**
   * Clear all cached data.
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        k => k.startsWith(CACHE_PREFIX) || k.startsWith(CACHE_META_PREFIX)
      );
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (e) {
      console.warn('[CacheManager] clearAll error:', e);
    }
  }

  /**
   * Get cache stats (total entries, approximate size).
   */
  async getStats(): Promise<{ entries: number; totalSize: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const metaKeys = keys.filter(k => k.startsWith(CACHE_META_PREFIX));
      const entries = await AsyncStorage.multiGet(metaKeys);

      let totalSize = 0;
      for (const [, raw] of entries) {
        if (raw) {
          const meta: CacheMeta = JSON.parse(raw);
          totalSize += meta.size;
        }
      }

      return { entries: entries.length, totalSize };
    } catch {
      return { entries: 0, totalSize: 0 };
    }
  }

  /**
   * Evict oldest entries if total cache exceeds maxBytes.
   */
  async evict(maxBytes: number = 5 * 1024 * 1024): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const metaKeys = keys.filter(k => k.startsWith(CACHE_META_PREFIX));
      const entries = await AsyncStorage.multiGet(metaKeys);

      const metas: CacheMeta[] = [];
      for (const [, raw] of entries) {
        if (raw) metas.push(JSON.parse(raw));
      }

      // Sort by age (oldest first)
      metas.sort((a, b) => a.cachedAt - b.cachedAt);

      let totalSize = metas.reduce((sum, m) => sum + m.size, 0);
      const toRemove: string[] = [];

      while (totalSize > maxBytes && metas.length > 0) {
        const oldest = metas.shift()!;
        totalSize -= oldest.size;
        toRemove.push(`${CACHE_PREFIX}${oldest.key}`);
        toRemove.push(`${CACHE_META_PREFIX}${oldest.key}`);
      }

      if (toRemove.length > 0) {
        await AsyncStorage.multiRemove(toRemove);
      }
    } catch (e) {
      console.warn('[CacheManager] evict error:', e);
    }
  }
}

export const cacheManager = new CacheManager();

export default cacheManager;
