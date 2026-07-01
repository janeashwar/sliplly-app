/**
 * Offline Module — Offline-first architecture for Sliplly
 *
 * Components:
 * - networkMonitor: Singleton network state tracker
 * - cacheManager: API response caching with TTL
 * - offlineQueue: Queued write operations, sync on reconnect
 * - OfflineBanner: UI indicator for offline status
 *
 * Usage:
 *   import { networkMonitor, cacheManager, offlineQueue, useOfflineStatus } from '../offline';
 */

export { networkMonitor, type NetworkStatus } from './networkMonitor';
export { cacheManager, type CacheEntry, type CacheMeta } from './cacheManager';
export { offlineQueue, type QueueOperation } from './offlineQueue';
export { default as OfflineBanner } from './OfflineBanner';
export { useOfflineStatus, usePendingOperations } from './hooks';
