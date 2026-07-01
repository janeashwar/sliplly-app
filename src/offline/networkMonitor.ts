/**
 * Network Monitor — Offline-first architecture
 *
 * Uses @react-native-community/netinfo to detect connectivity.
 * Exposes a singleton with subscribe/unsubscribe pattern.
 * All modules can check `networkMonitor.isOnline` or subscribe to changes.
 */

import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

export type NetworkStatus = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
};

type Listener = (status: NetworkStatus) => void;

class NetworkMonitor {
  private _status: NetworkStatus = {
    isConnected: false,
    isInternetReachable: null,
    type: 'unknown',
    isWifi: false,
    isCellular: false,
  };

  private _listeners: Set<Listener> = new Set();
  private _subscription: NetInfoSubscription | null = null;
  private _initialized = false;

  /** Current online status */
  get isOnline(): boolean {
    return this._status.isConnected && this._status.isInternetReachable !== false;
  }

  /** Full status object */
  get status(): NetworkStatus {
    return { ...this._status };
  }

  /** Start listening to network changes */
  initialize(): void {
    if (this._initialized) return;
    this._initialized = true;

    // Subscribe to state changes
    this._subscription = NetInfo.addEventListener((state: NetInfoState) => {
      const prev = this._status;
      this._status = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
      };

      // Notify listeners if connectivity changed
      if (prev.isConnected !== this._status.isConnected ||
          prev.isInternetReachable !== this._status.isInternetReachable) {
        this._notify();
      }
    });

    // Also fetch initial state
    NetInfo.refresh();
  }

  /** Stop listening */
  destroy(): void {
    if (this._subscription) {
      this._subscription();
      this._subscription = null;
    }
    this._initialized = false;
  }

  /** Subscribe to connectivity changes */
  subscribe(listener: Listener): () => void {
    this._listeners.add(listener);
    // Immediately invoke with current status
    listener(this._status);
    return () => {
      this._listeners.delete(listener);
    };
  }

  /** Force-refresh network state */
  async refresh(): Promise<NetworkStatus> {
    const state = await NetInfo.refresh();
    this._status = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      isWifi: state.type === 'wifi',
      isCellular: state.type === 'cellular',
    };
    this._notify();
    return this._status;
  }

  /** Wait until online (with timeout) */
  async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    if (this.isOnline) return true;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        unsub();
        resolve(false);
      }, timeoutMs);

      const unsub = this.subscribe((status) => {
        if (status.isConnected && status.isInternetReachable !== false) {
          clearTimeout(timeout);
          unsub();
          resolve(true);
        }
      });
    });
  }

  private _notify(): void {
    const status = this._status;
    this._listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (e) {
        console.error('[NetworkMonitor] Listener error:', e);
      }
    });
  }
}

// Singleton
export const networkMonitor = new NetworkMonitor();

export default networkMonitor;
