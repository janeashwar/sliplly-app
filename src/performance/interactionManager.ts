/**
 * Interaction Manager — Defer heavy work until after navigation/animations complete
 *
 * Wraps React Native's InteractionManager with timeout and cancellation support.
 * Use this for heavy operations that shouldn't block UI (API calls, data processing).
 */

import { InteractionManager } from 'react-native';

/**
 * Run a callback after all interactions/animations complete.
 * Returns a cancel function.
 */
export function runAfterInteractions(callback: () => void | Promise<void>): () => void {
  const handle = InteractionManager.runAfterInteractions(() => {
    callback();
  });

  return () => handle.cancel();
}

/**
 * Run a callback after interactions with a timeout.
 * If interactions don't complete within `timeoutMs`, runs anyway.
 */
export function runAfterInteractionsWithTimeout(
  callback: () => void | Promise<void>,
  timeoutMs: number = 2000,
): () => void {
  let cancelled = false;

  const timeout = setTimeout(() => {
    if (!cancelled) callback();
  }, timeoutMs);

  const handle = InteractionManager.runAfterInteractions(() => {
    clearTimeout(timeout);
    if (!cancelled) callback();
  });

  return () => {
    cancelled = true;
    clearTimeout(timeout);
    handle.cancel();
  };
}

/**
 * Create a deferred task that runs after interactions.
 * Returns { run, cancel } for flexible control.
 */
export function createDeferredTask<T>(
  task: () => Promise<T>,
  options?: { timeout?: number }
): { run: () => Promise<T>; cancel: () => void } {
  let cancelled = false;
  let resolvePromise: ((value: T) => void) | null = null;
  let rejectPromise: ((reason: any) => void) | null = null;

  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  const cancel = () => {
    cancelled = true;
    rejectPromise?.(new Error('DeferredTask cancelled'));
  };

  const run = (): Promise<T> => {
    const cleanup = runAfterInteractionsWithTimeout(
      async () => {
        if (cancelled) return;
        try {
          const result = await task();
          if (!cancelled) resolvePromise?.(result);
        } catch (e) {
          if (!cancelled) rejectPromise?.(e);
        }
      },
      options?.timeout ?? 2000,
    );

    // Also return the cancel function combined
    const origCancel = cancel;
    const combinedCancel = () => {
      cleanup();
      origCancel();
    };

    return { promise, cancel: combinedCancel } as any;
  };

  return { run, cancel };
}

/**
 * Hook-friendly wrapper: run heavy work after mount/navigation.
 * Automatically cancels on unmount.
 *
 * Usage:
 *   useAfterInteractions(() => { loadData(); });
 */
export function useAfterInteractions(effect: () => void | (() => void), deps: any[] = []) {
  // This is intentionally not a hook — use runAfterInteractions in useEffect instead
  // Import in component:
  //   useEffect(() => runAfterInteractions(() => heavyWork()), []);
  throw new Error('Use runAfterInteractions inside useEffect instead');
}

export default {
  runAfterInteractions,
  runAfterInteractionsWithTimeout,
  createDeferredTask,
};
