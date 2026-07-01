/**
 * Toast Singleton Manager — Sliplly
 * Global showToast() function that works from anywhere in the app.
 * The Toast component in _layout.tsx subscribes to this.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms, default 3000
}

export interface ToastData extends ToastOptions {
  id: string;
  timestamp: number;
}

type ToastListener = (toast: ToastData) => void;

let listener: ToastListener | null = null;
let counter = 0;

/** Register the toast listener (called by Toast component on mount) */
export function setToastListener(fn: ToastListener) {
  listener = fn;
}

/** Remove the toast listener */
export function clearToastListener() {
  listener = null;
}

/** Show a toast notification */
export function showToast(options: ToastOptions) {
  if (!listener) {
    // Fallback: if Toast component isn't mounted yet, log to console
    console.warn('[Toast]', options.title || options.type || 'info', '-', options.message);
    return;
  }

  const toast: ToastData = {
    id: String(++counter),
    timestamp: Date.now(),
    type: 'info',
    duration: 3000,
    ...options,
  };

  listener(toast);
}

/** Convenience helpers */
export const toast = {
  success: (message: string, title?: string) =>
    showToast({ type: 'success', message, title }),
  error: (message: string, title?: string) =>
    showToast({ type: 'error', message, title }),
  warning: (message: string, title?: string) =>
    showToast({ type: 'warning', message, title }),
  info: (message: string, title?: string) =>
    showToast({ type: 'info', message, title }),
};
