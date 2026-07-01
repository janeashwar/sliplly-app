/**
 * Notification Service — Push notifications via expo-notifications
 *
 * Handles:
 * - Permission requests
 * - Push token registration
 * - Local notification scheduling
 * - Notification tap handling (deep linking)
 * - Badge count management
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_PREFS_KEY = '@sliplly_notification_prefs';
const PUSH_TOKEN_KEY = '@sliplly_push_token';

// ── Notification Categories ──
export type NotificationCategory =
  | 'new_booking'
  | 'trip_status'
  | 'payment_received'
  | 'trip_reminder'
  | 'general';

// ── Notification Preferences ──
export interface NotificationPreferences {
  newBooking: boolean;
  tripStatus: boolean;
  paymentReceived: boolean;
  tripReminder: boolean;
  general: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  newBooking: true,
  tripStatus: true,
  paymentReceived: true,
  tripReminder: true,
  general: true,
  sound: true,
  vibration: true,
  badge: true,
};

// ── Configure notification behavior ──
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Navigation handler (set by app root) ──
type NotificationTapHandler = (data: any) => void;
let tapHandler: NotificationTapHandler | null = null;

class NotificationService {
  private _pushToken: string | null = null;
  private _preferences: NotificationPreferences = DEFAULT_PREFS;
  private _badgeCount: number = 0;
  private _initialized = false;

  get pushToken(): string | null {
    return this._pushToken;
  }

  get preferences(): NotificationPreferences {
    return { ...this._preferences };
  }

  get badgeCount(): number {
    return this._badgeCount;
  }

  /**
   * Initialize the notification service.
   * Requests permissions, gets push token, loads preferences.
   */
  async initialize(): Promise<boolean> {
    if (this._initialized) return true;
    this._initialized = true;

    // Load saved preferences
    await this._loadPreferences();

    // Request permissions
    const granted = await this.requestPermissions();
    if (!granted) {
      console.warn('[Notifications] Permission not granted');
      return false;
    }

    // Get push token
    await this._registerPushToken();

    // Set up notification listeners
    this._setupListeners();

    return true;
  }

  /**
   * Request notification permissions.
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('[Notifications] Push notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Android: create notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#d6ed6a',
      });

      await Notifications.setNotificationChannelAsync('bookings', {
        name: 'Bookings',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#d6ed6a',
        description: 'New booking notifications',
      });

      await Notifications.setNotificationChannelAsync('trips', {
        name: 'Trips',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#60A5FA',
        description: 'Trip status updates',
      });

      await Notifications.setNotificationChannelAsync('payments', {
        name: 'Payments',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#34D399',
        description: 'Payment notifications',
      });
    }

    return true;
  }

  /**
   * Get and register push token with backend.
   */
  private async _registerPushToken(): Promise<void> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.warn('[Notifications] No EAS project ID configured');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this._pushToken = tokenData.data;

      // Save token locally
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, this._pushToken);

      // TODO: Send token to your backend API
      // await api.post('/notifications/register-token', { token: this._pushToken });
      console.log('[Notifications] Push token registered:', this._pushToken.substring(0, 20) + '...');
    } catch (error) {
      console.error('[Notifications] Failed to get push token:', error);
    }
  }

  /**
   * Set up notification event listeners.
   */
  private _setupListeners(): void {
    // Notification received while app is foregrounded
    Notifications.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      console.log('[Notifications] Received:', title);

      // Update badge count
      if (this._preferences.badge) {
        this._badgeCount++;
        Notifications.setBadgeCountAsync(this._badgeCount);
      }
    });

    // User tapped on notification
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('[Notifications] Tapped:', data);

      // Reset badge on tap
      this._badgeCount = Math.max(0, this._badgeCount - 1);
      Notifications.setBadgeCountAsync(this._badgeCount);

      // Navigate to relevant screen
      if (tapHandler) {
        tapHandler(data);
      }
    });
  }

  /**
   * Set handler for notification taps (call from root layout).
   */
  setTapHandler(handler: NotificationTapHandler): void {
    tapHandler = handler;
  }

  // ── Local Notifications ──

  /**
   * Show a local notification for a new booking.
   */
  async notifyNewBooking(booking: {
    guestName: string;
    tripCode: string;
    amount?: number;
  }): Promise<void> {
    if (!this._preferences.newBooking) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚗 New Booking',
        body: `${booking.guestName} booked trip ${booking.tripCode}${booking.amount ? ` for ₹${booking.amount}` : ''}`,
        data: {
          type: 'new_booking',
          tripCode: booking.tripCode,
          screen: '/trip-details',
        },
        sound: this._preferences.sound ? 'default' : undefined,
        badge: this._preferences.badge ? 1 : undefined,
      },
      trigger: null, // immediate
    });
  }

  /**
   * Show a local notification for trip status change.
   */
  async notifyTripStatusChange(trip: {
    tripCode: string;
    guestName: string;
    newStatus: string;
  }): Promise<void> {
    if (!this._preferences.tripStatus) return;

    const statusEmoji: Record<string, string> = {
      confirmed: '✅',
      'in-progress': '🔄',
      completed: '🎉',
      cancelled: '❌',
    };

    const emoji = statusEmoji[trip.newStatus] || '📋';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} Trip ${trip.newStatus}`,
        body: `Trip ${trip.tripCode} (${trip.guestName}) is now ${trip.newStatus}`,
        data: {
          type: 'trip_status',
          tripCode: trip.tripCode,
          screen: '/trip-details',
        },
        sound: this._preferences.sound ? 'default' : undefined,
      },
      trigger: null,
    });
  }

  /**
   * Show a local notification for payment received.
   */
  async notifyPaymentReceived(payment: {
    amount: number;
    guestName: string;
    tripCode: string;
    method?: string;
  }): Promise<void> {
    if (!this._preferences.paymentReceived) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 Payment Received',
        body: `₹${payment.amount.toLocaleString('en-IN')} from ${payment.guestName}${payment.method ? ` via ${payment.method}` : ''}`,
        data: {
          type: 'payment_received',
          tripCode: payment.tripCode,
          screen: '/wallet',
        },
        sound: this._preferences.sound ? 'default' : undefined,
      },
      trigger: null,
    });
  }

  /**
   * Schedule a trip reminder notification.
   */
  async scheduleTripReminder(trip: {
    tripCode: string;
    guestName: string;
    scheduledAt: Date;
  }): Promise<void> {
    if (!this._preferences.tripReminder) return;

    // Schedule 30 minutes before
    const triggerDate = new Date(trip.scheduledAt.getTime() - 30 * 60 * 1000);
    if (triggerDate <= new Date()) return; // Already past

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Trip Reminder',
        body: `Trip ${trip.tripCode} with ${trip.guestName} starts in 30 minutes`,
        data: {
          type: 'trip_reminder',
          tripCode: trip.tripCode,
          screen: '/trip-details',
        },
        sound: this._preferences.sound ? 'default' : undefined,
      },
      trigger: { date: triggerDate },
    });
  }

  // ── Preferences ──

  /**
   * Update notification preferences.
   */
  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<void> {
    this._preferences = { ...this._preferences, ...prefs };
    await this._savePreferences();
  }

  /**
   * Get current preferences.
   */
  getPreferences(): NotificationPreferences {
    return { ...this._preferences };
  }

  // ── Badge ──

  /**
   * Clear badge count.
   */
  async clearBadge(): Promise<void> {
    this._badgeCount = 0;
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Set badge count.
   */
  async setBadgeCount(count: number): Promise<void> {
    this._badgeCount = count;
    await Notifications.setBadgeCountAsync(count);
  }

  // ── Cancel ──

  /**
   * Cancel all scheduled notifications.
   */
  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Cancel notifications by type.
   */
  async cancelByType(type: NotificationCategory): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.type === type) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  // ── Private ──

  private async _loadPreferences(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (raw) {
        this._preferences = { ...DEFAULT_PREFS, ...JSON.parse(raw) };
      }
    } catch {
      this._preferences = DEFAULT_PREFS;
    }
  }

  private async _savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(this._preferences));
    } catch (e) {
      console.warn('[Notifications] Failed to save preferences:', e);
    }
  }
}

export const notificationService = new NotificationService();

export default notificationService;
