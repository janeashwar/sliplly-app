/**
 * Haptic Feedback Utility — Sliplly
 * Wraps expo-haptics with graceful fallback (no-op on unsupported devices).
 *
 * Haptic vocabulary:
 *   Light    — text input, typing feedback, scrolling through lists
 *   Medium   — card taps, button presses, tab switches
 *   Heavy    — FAB press, booking confirmation, destructive actions
 *   Success  — booking created, payment received, form submitted
 *   Warning  — validation errors, missing fields
 *   Error    — API failures, critical errors
 *   Selection — dropdown selection, segmented control, picker change
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Check if haptics are available (skip on web)
const isSupported = Platform.OS !== 'web';

/** Light impact — text input, typing, scrolling */
export function hapticLight() {
  if (!isSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Light tap — backward-compatible alias for hapticLight */
export function hapticTap() {
  if (!isSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium impact — card presses, button presses, tab switches */
export function hapticMedium() {
  if (!isSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Heavy impact — FAB press, booking confirmation, destructive actions */
export function hapticHeavy() {
  if (!isSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Success notification — booking created, form submitted, payment received */
export function hapticSuccess() {
  if (!isSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Warning notification — validation error, missing field */
export function hapticWarning() {
  if (!isSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/** Error notification — API failure, critical error */
export function hapticError() {
  if (!isSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** Selection changed — dropdown, segmented control, picker, toggle */
export function hapticSelection() {
  if (!isSupported) return;
  Haptics.selectionAsync();
}
