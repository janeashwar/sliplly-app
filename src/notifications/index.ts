/**
 * Notifications Module — Push notifications for Sliplly
 *
 * Components:
 * - notificationService: Permission handling, local notifications, tap routing
 * - NotificationPreferences: Settings screen for notification toggles
 *
 * Usage:
 *   import { notificationService } from '../notifications';
 *   await notificationService.initialize();
 *   await notificationService.notifyNewBooking({ guestName: 'Raj', tripCode: 'SL-123' });
 */

export { notificationService, type NotificationPreferences, type NotificationCategory } from './notificationService';
export { default as NotificationPreferencesScreen } from './NotificationPreferences';
