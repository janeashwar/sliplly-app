/**
 * Offline Hooks — React hooks for offline-first architecture
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { networkMonitor, NetworkStatus } from './networkMonitor';
import { offlineQueue } from './offlineQueue';
import { cacheManager } from './cacheManager';

/**
 * Hook to get current offline status.
 * Re-renders when connectivity changes.
 */
export function useOfflineStatus() {
  const [status, setStatus] = useState<NetworkStatus>(networkMonitor.status);
  const [isOnline, setIsOnline] = useState(networkMonitor.isOnline);

  useEffect(() => {
    const unsub = networkMonitor.subscribe((s) => {
      setStatus(s);
      setIsOnline(s.isConnected && s.isInternetReachable !== false);
    });
    return unsub;
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    status,
    isWifi: status.isWifi,
    isCellular: status.isCellular,
  };
}

/**
 * Hook to get pending offline queue operations count.
 */
export function usePendingOperations() {
  const [count, setCount] = useState(offlineQueue.pendingCount);
  const [isSyncing, setIsSyncing] = useState(offlineQueue.isSyncing);

  useEffect(() => {
    const unsub = offlineQueue.subscribe((c) => {
      setCount(c);
      setIsSyncing(offlineQueue.isSyncing);
    });
    return unsub;
  }, []);

  return { pendingCount: count, isSyncing };
}

/**
 * Hook for cached API data with offline support.
 * Returns cached data immediately, fetches fresh data when online.
 *
 * NOTE: If `fetcher` creates a new function reference each render,
 * wrap it in useCallback in the calling component to avoid re-fetch loops.
 */
export function useCachedData<T>(
  endpoint: string,
  fetcher: () => Promise<T>,
  options?: {
    params?: Record<string, any>;
    enabled?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline } = useOfflineStatus();
  const fetcherRef = useRef(fetcher);
  const mountedRef = useRef(true);

  // Keep fetcher ref current
  fetcherRef.current = fetcher;

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const enabled = options?.enabled !== false;

  const load = useCallback(async () => {
    if (!enabled) return;

    if (mountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    // Try cache first
    const cached = await cacheManager.get<T>(endpoint, options?.params);
    if (cached) {
      if (mountedRef.current) {
        setData(cached.data);
        setIsFromCache(true);
        setIsLoading(false);
      }

      // If online, also fetch fresh data in background (stale-while-revalidate)
      if (isOnline) {
        try {
          const fresh = await fetcherRef.current();
          await cacheManager.set(endpoint, fresh, options?.params);
          if (mountedRef.current) {
            setData(fresh);
            setIsFromCache(false);
          }
        } catch (e) {
          // Cache hit is still valid, just couldn't refresh
          console.warn('[useCachedData] Background refresh failed:', e);
        }
      }
      return;
    }

    // No cache — must fetch
    if (!isOnline) {
      if (mountedRef.current) {
        setIsLoading(false);
        setError(new Error('No cached data available offline'));
      }
      return;
    }

    try {
      const fresh = await fetcherRef.current();
      await cacheManager.set(endpoint, fresh, options?.params);
      if (mountedRef.current) {
        setData(fresh);
        setIsFromCache(false);
      }
    } catch (e: any) {
      if (mountedRef.current) setError(e);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [endpoint, isOnline, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(async () => {
    if (!isOnline) return;
    if (mountedRef.current) setIsLoading(true);
    try {
      const fresh = await fetcherRef.current();
      await cacheManager.set(endpoint, fresh, options?.params);
      if (mountedRef.current) {
        setData(fresh);
        setIsFromCache(false);
        setError(null);
      }
    } catch (e: any) {
      if (mountedRef.current) setError(e);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [endpoint, isOnline]);

  return { data, isLoading, isFromCache, error, refetch };
}
