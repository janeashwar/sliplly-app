/**
 * Offline Queue — Queues write operations when offline, syncs when back online
 *
 * Operations are persisted in AsyncStorage so they survive app restarts.
 * On reconnect, operations are replayed in FIFO order.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkMonitor } from './networkMonitor';

const QUEUE_KEY = '@sliplly_offline_queue';

export type QueueOperation = {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  createdAt: number;
  retries: number;
  maxRetries: number;
  tag?: string; // e.g., 'booking', 'profile' for grouped invalidation
};

type QueueListener = (pending: number) => void;

let idCounter = 0;

class OfflineQueue {
  private _queue: QueueOperation[] = [];
  private _isSyncing = false;
  private _listeners: Set<QueueListener> = new Set();
  private _unsubscribeNetwork: (() => void) | null = null;
  private _executor: ((op: QueueOperation) => Promise<any>) | null = null;
  private _initialized = false;

  /** Number of pending operations */
  get pendingCount(): number {
    return this._queue.length;
  }

  /** Whether currently syncing */
  get isSyncing(): boolean {
    return this._isSyncing;
  }

  /** Pending operations */
  get operations(): QueueOperation[] {
    return [...this._queue];
  }

  /**
   * Initialize the queue. Loads persisted operations and listens for reconnection.
   * @param executor Function that executes an operation (wraps your api.put/post/delete)
   */
  async initialize(executor: (op: QueueOperation) => Promise<any>): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;

    this._executor = executor;

    // Load persisted queue
    await this._load();

    // Listen for reconnection to trigger sync
    this._unsubscribeNetwork = networkMonitor.subscribe((status) => {
      if (status.isConnected && status.isInternetReachable !== false && this._queue.length > 0) {
        this.sync();
      }
    });
  }

  /** Destroy and clean up */
  destroy(): void {
    if (this._unsubscribeNetwork) {
      this._unsubscribeNetwork();
      this._unsubscribeNetwork = null;
    }
    this._initialized = false;
  }

  /**
   * Enqueue an operation. If online, it will be executed immediately.
   * If offline, it's persisted and retried on reconnect.
   */
  async enqueue(operation: Omit<QueueOperation, 'id' | 'createdAt' | 'retries' | 'maxRetries'>): Promise<string> {
    const op: QueueOperation = {
      ...operation,
      id: `q_${Date.now()}_${++idCounter}`,
      createdAt: Date.now(),
      retries: 0,
      maxRetries: 3,
    };

    this._queue.push(op);
    await this._persist();
    this._notify();

    // If online, try to execute immediately
    if (networkMonitor.isOnline && this._executor) {
      this.sync();
    }

    return op.id;
  }

  /**
   * Manually trigger sync of all pending operations.
   */
  async sync(): Promise<{ succeeded: number; failed: number }> {
    if (this._isSyncing || !this._executor || this._queue.length === 0) {
      return { succeeded: 0, failed: 0 };
    }

    this._isSyncing = true;
    let succeeded = 0;
    let failed = 0;

    // Process in FIFO order
    while (this._queue.length > 0) {
      const op = this._queue[0];

      // Check connectivity before each operation
      if (!networkMonitor.isOnline) break;

      try {
        await this._executor(op);
        this._queue.shift(); // Remove from queue
        succeeded++;
      } catch (error) {
        op.retries++;
        if (op.retries >= op.maxRetries) {
          // Max retries exceeded — remove and log
          console.warn(`[OfflineQueue] Max retries for ${op.method} ${op.endpoint}:`, error);
          this._queue.shift();
          failed++;
        } else {
          // Will retry on next sync
          console.warn(`[OfflineQueue] Retry ${op.retries}/${op.maxRetries} for ${op.method} ${op.endpoint}`);
          break; // Stop processing to avoid cascading failures
        }
      }
    }

    await this._persist();
    this._isSyncing = false;
    this._notify();

    return { succeeded, failed };
  }

  /**
   * Clear all pending operations (e.g., on logout).
   */
  async clear(): Promise<void> {
    this._queue = [];
    await this._persist();
    this._notify();
  }

  /**
   * Remove a specific operation by ID.
   */
  async remove(id: string): Promise<void> {
    this._queue = this._queue.filter(op => op.id !== id);
    await this._persist();
    this._notify();
  }

  /** Subscribe to queue size changes */
  subscribe(listener: QueueListener): () => void {
    this._listeners.add(listener);
    listener(this._queue.length);
    return () => this._listeners.delete(listener);
  }

  /** Get operations by tag */
  getByTag(tag: string): QueueOperation[] {
    return this._queue.filter(op => op.tag === tag);
  }

  private async _persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this._queue));
    } catch (e) {
      console.warn('[OfflineQueue] persist error:', e);
    }
  }

  private async _load(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (raw) {
        this._queue = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[OfflineQueue] load error:', e);
      this._queue = [];
    }
  }

  private _notify(): void {
    const count = this._queue.length;
    this._listeners.forEach(listener => {
      try { listener(count); } catch {}
    });
  }
}

export const offlineQueue = new OfflineQueue();

export default offlineQueue;
