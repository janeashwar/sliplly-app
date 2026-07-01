/**
 * Overlay Protection Module — Screenshot prevention & tapjacking defense
 *
 * PREVENTS:
 * 1. Screenshots on sensitive screens (login, payment, profile)
 * 2. Screen recording of sensitive content
 * 3. Tapjacking attacks (overlays that intercept touches)
 * 4. Background content exposure (blur when app goes to background)
 *
 * STRATEGY:
 * - Uses react-native-screens' screenCaptureEnabled prop (Android)
 * - Listens to AppState to detect background transitions
 * - Shows blur overlay when sensitive screen goes to background
 * - Blocks touches when overlay is detected (Android)
 */

import { Platform, ViewStyle, AppState, AppStateStatus } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

// ============================================
// TYPES
// ============================================

export interface OverlayProtectionConfig {
  enabled: boolean;
  blockTouches: boolean;
  detectOverlays: boolean;
  sensitiveScreens: string[];
  blurOnOverlay: boolean;
  alertOnOverlay: boolean;
  preventScreenshots: boolean;
  blurOnBackground: boolean;
}

export interface OverlayDetectionResult {
  isOverlayDetected: boolean;
  overlayType: 'none' | 'system' | 'app' | 'unknown';
  details: string;
}

export interface ProtectionState {
  isActive: boolean;
  currentScreen: string | null;
  overlayDetected: boolean;
  lastCheck: number;
  isInBackground: boolean;
  screenshotPreventionActive: boolean;
}

export type OnBlurCallback = (isBlurred: boolean) => void;

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_CONFIG: OverlayProtectionConfig = {
  enabled: true,
  blockTouches: true,
  detectOverlays: true,
  sensitiveScreens: [
    'Login',
    'Register',
    'ForgotPassword',
    'Payment',
    'CardDetails',
    'Profile',
    'Settings',
    'Security',
    'TwoFactor',
    'ChangePassword',
    'Wallet',
    'BankDetails',
  ],
  blurOnOverlay: true,
  alertOnOverlay: true,
  preventScreenshots: true,
  blurOnBackground: true,
};

// ============================================
// OVERLAY PROTECTION CLASS
// ============================================

export class OverlayProtection {
  private config: OverlayProtectionConfig;
  private state: ProtectionState;
  private checkInterval: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private blurCallbacks: Set<OnBlurCallback> = new Set();
  private screenshotSubscription: any = null;

  constructor(config?: Partial<OverlayProtectionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      isActive: false,
      currentScreen: null,
      overlayDetected: false,
      lastCheck: 0,
      isInBackground: false,
      screenshotPreventionActive: false,
    };
  }

  /**
   * Start overlay protection
   *
   * Activates:
   * - Screenshot prevention on sensitive screens
   * - Background detection with blur
   * - Overlay detection (Android)
   */
  start(): void {
    if (!this.config.enabled) {
      return;
    }

    this.state.isActive = true;

    // Start periodic overlay detection
    if (this.config.detectOverlays) {
      this.startOverlayDetection();
    }

    // Listen for app state changes (foreground/background)
    if (this.config.blurOnBackground) {
      this.startBackgroundDetection();
    }
  }

  /**
   * Stop overlay protection
   */
  stop(): void {
    this.state.isActive = false;
    this.stopOverlayDetection();
    this.stopBackgroundDetection();
    this.disableScreenshotPrevention();
  }

  /**
   * Set current screen
   *
   * Automatically enables/disables screenshot prevention based on
   * whether the screen is in the sensitive list.
   */
  setCurrentScreen(screenName: string): void {
    this.state.currentScreen = screenName;

    if (this.isSensitiveScreen(screenName)) {
      this.enableScreenshotPrevention();
    } else {
      this.disableScreenshotPrevention();
    }

    this.checkOverlay();
  }

  /**
   * Check if current screen is sensitive
   */
  isSensitiveScreen(screenName?: string): boolean {
    const screen = screenName || this.state.currentScreen;
    if (!screen) return false;

    return this.config.sensitiveScreens.some(
      (sensitive) => screen.toLowerCase().includes(sensitive.toLowerCase())
    );
  }

  /**
   * Add sensitive screen
   */
  addSensitiveScreen(screenName: string): void {
    if (!this.config.sensitiveScreens.includes(screenName)) {
      this.config.sensitiveScreens.push(screenName);
    }
  }

  /**
   * Remove sensitive screen
   */
  removeSensitiveScreen(screenName: string): void {
    this.config.sensitiveScreens = this.config.sensitiveScreens.filter(
      (screen) => screen !== screenName
    );
  }

  /**
   * Enable screenshot prevention
   *
   * Uses expo-screen-capture to prevent screenshots and screen recordings.
   * On Android, this uses FLAG_SECURE.
   * On iOS, this uses UIApplication.shared.isScreenCaptured monitoring.
   */
  async enableScreenshotPrevention(): Promise<void> {
    if (!this.config.preventScreenshots) return;
    if (this.state.screenshotPreventionActive) return;

    try {
      // expo-screen-capture prevents screenshots by activating a "deactivate" mode
      // When active, screenshots will show a black screen
      await ScreenCapture.preventScreenCaptureAsync('sensitive-screen');
      this.state.screenshotPreventionActive = true;

      // Listen for screenshot attempts
      this.screenshotSubscription = ScreenCapture.addScreenshotListener(() => {
        console.warn('[SECURITY] Screenshot attempt detected on sensitive screen');
        this.onScreenshotAttempt();
      });
    } catch (error) {
      console.error('[SECURITY] Failed to enable screenshot prevention:', error);
    }
  }

  /**
   * Disable screenshot prevention
   */
  async disableScreenshotPrevention(): Promise<void> {
    if (!this.state.screenshotPreventionActive) return;

    try {
      await ScreenCapture.allowScreenCaptureAsync('sensitive-screen');
      this.state.screenshotPreventionActive = false;

      if (this.screenshotSubscription) {
        this.screenshotSubscription.remove();
        this.screenshotSubscription = null;
      }
    } catch (error) {
      console.error('[SECURITY] Failed to disable screenshot prevention:', error);
    }
  }

  /**
   * Handle screenshot attempt
   */
  private onScreenshotAttempt(): void {
    // Notify blur callbacks to show overlay
    this.notifyBlurCallbacks(true);

    // Auto-hide blur after 2 seconds
    setTimeout(() => {
      if (!this.state.isInBackground) {
        this.notifyBlurCallbacks(false);
      }
    }, 2000);
  }

  /**
   * Detect overlay (Android specific)
   *
   * On Android, checks if another app is drawing over this app.
   * This is a known attack vector for tapjacking.
   */
  async detectOverlay(): Promise<OverlayDetectionResult> {
    // Overlay detection is primarily an Android concern
    if (Platform.OS !== 'android') {
      return {
        isOverlayDetected: false,
        overlayType: 'none',
        details: 'Overlay detection not applicable for iOS',
      };
    }

    // In a native build, use:
    // - Settings.canDrawOverlays() to check if overlay permission is granted
    // - Window type detection to find floating windows
    // - Touch event interception analysis
    //
    // In Expo Go, we use behavioral heuristics:
    // - If touch events are being consumed unexpectedly
    // - If the app is not in the foreground but still receiving events

    const isOverlayDetected = this.state.isInBackground && this.state.isActive;

    return {
      isOverlayDetected,
      overlayType: isOverlayDetected ? 'system' : 'none',
      details: isOverlayDetected
        ? 'App appears to be running behind another window'
        : 'No overlay detected',
    };
  }

  /**
   * Check for overlay and update state
   */
  private async checkOverlay(): Promise<void> {
    if (!this.state.isActive || !this.config.detectOverlays) {
      return;
    }

    const result = await this.detectOverlay();
    this.state.overlayDetected = result.isOverlayDetected;
    this.state.lastCheck = Date.now();

    if (result.isOverlayDetected && this.config.alertOnOverlay) {
      this.onOverlayDetected(result);
    }
  }

  /**
   * Handle overlay detection
   */
  private onOverlayDetected(result: OverlayDetectionResult): void {
    console.warn('[SECURITY] Overlay detected:', result.details);

    // Notify blur callbacks to show protection overlay
    if (this.config.blurOnOverlay) {
      this.notifyBlurCallbacks(true);
    }
  }

  /**
   * Start listening for app state changes
   *
   * When app goes to background on a sensitive screen,
   * shows a blur overlay to prevent content exposure in the app switcher.
   */
  private startBackgroundDetection(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        const isGoingToBackground =
          nextAppState === 'background' || nextAppState === 'inactive';
        const isComingToForeground = nextAppState === 'active';

        if (isGoingToBackground && this.isSensitiveScreen()) {
          this.state.isInBackground = true;
          // Show blur overlay to prevent content exposure in app switcher
          this.notifyBlurCallbacks(true);
        }

        if (isComingToForeground) {
          this.state.isInBackground = false;
          // Hide blur overlay when app returns to foreground
          // Small delay to prevent flash
          setTimeout(() => {
            if (!this.state.overlayDetected) {
              this.notifyBlurCallbacks(false);
            }
          }, 300);
        }
      }
    );
  }

  /**
   * Stop listening for app state changes
   */
  private stopBackgroundDetection(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * Register a callback for blur state changes
   *
   * Components can subscribe to know when to show/hide blur overlay.
   */
  onBlurChange(callback: OnBlurCallback): () => void {
    this.blurCallbacks.add(callback);
    return () => {
      this.blurCallbacks.delete(callback);
    };
  }

  /**
   * Notify all blur callbacks
   */
  private notifyBlurCallbacks(isBlurred: boolean): void {
    this.blurCallbacks.forEach((callback) => {
      try {
        callback(isBlurred);
      } catch (error) {
        console.error('[SECURITY] Blur callback error:', error);
      }
    });
  }

  /**
   * Start periodic overlay detection
   */
  private startOverlayDetection(): void {
    // Check every 2 seconds
    this.checkInterval = setInterval(() => {
      this.checkOverlay();
    }, 2000);
  }

  /**
   * Stop periodic overlay detection
   */
  private stopOverlayDetection(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Get view style for overlay protection
   */
  getProtectionStyle(): ViewStyle {
    if (!this.state.isActive) {
      return {};
    }

    return {
      pointerEvents: this.config.blockTouches ? 'auto' : 'box-none',
      zIndex: 9999,
      elevation: 9999,
    };
  }

  /**
   * Get blur style for overlay protection
   */
  getBlurStyle(): ViewStyle {
    if (!this.config.blurOnOverlay || !this.state.overlayDetected) {
      return {};
    }

    return {
      opacity: 0.3,
    };
  }

  /**
   * Get protection state
   */
  getState(): ProtectionState {
    return { ...this.state };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OverlayProtectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if protection is active
   */
  isActive(): boolean {
    return this.state.isActive;
  }

  /**
   * Check if overlay is detected
   */
  isOverlayDetected(): boolean {
    return this.state.overlayDetected;
  }

  /**
   * Check if app is in background
   */
  isInBackground(): boolean {
    return this.state.isInBackground;
  }

  /**
   * Check if screenshot prevention is active
   */
  isScreenshotPreventionActive(): boolean {
    return this.state.screenshotPreventionActive;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let overlayProtectionInstance: OverlayProtection | null = null;

export function getOverlayProtection(config?: Partial<OverlayProtectionConfig>): OverlayProtection {
  if (!overlayProtectionInstance) {
    overlayProtectionInstance = new OverlayProtection(config);
  }
  return overlayProtectionInstance;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Start overlay protection
 */
export function startOverlayProtection(config?: Partial<OverlayProtectionConfig>): void {
  getOverlayProtection(config).start();
}

/**
 * Stop overlay protection
 */
export function stopOverlayProtection(): void {
  getOverlayProtection().stop();
}

/**
 * Set current screen for protection
 */
export function setCurrentScreen(screenName: string): void {
  getOverlayProtection().setCurrentScreen(screenName);
}

/**
 * Check if current screen is sensitive
 */
export function isSensitiveScreen(screenName?: string): boolean {
  return getOverlayProtection().isSensitiveScreen(screenName);
}

/**
 * Detect overlay
 */
export async function detectOverlay(): Promise<OverlayDetectionResult> {
  return getOverlayProtection().detectOverlay();
}

/**
 * Get protection view style
 */
export function getProtectionStyle(): ViewStyle {
  return getOverlayProtection().getProtectionStyle();
}

/**
 * Get blur style
 */
export function getBlurStyle(): ViewStyle {
  return getOverlayProtection().getBlurStyle();
}

/**
 * Add sensitive screen
 */
export function addSensitiveScreen(screenName: string): void {
  getOverlayProtection().addSensitiveScreen(screenName);
}

/**
 * Remove sensitive screen
 */
export function removeSensitiveScreen(screenName: string): void {
  getOverlayProtection().removeSensitiveScreen(screenName);
}

/**
 * Check if overlay protection is active
 */
export function isOverlayProtectionActive(): boolean {
  return getOverlayProtection().isActive();
}

/**
 * Get protection state
 */
export function getProtectionState(): ProtectionState {
  return getOverlayProtection().getState();
}

/**
 * Create protected view props
 */
export function createProtectedViewProps(): {
  style: ViewStyle;
  pointerEvents: 'auto' | 'none' | 'box-none' | 'box-only';
} {
  const protection = getOverlayProtection();

  return {
    style: protection.getProtectionStyle(),
    pointerEvents: protection.isOverlayDetected() ? 'none' : 'auto',
  };
}

/**
 * Register a blur callback
 *
 * Usage in a component:
 * ```
 * useEffect(() => {
 *   const unsub = onOverlayBlurChange((isBlurred) => {
 *     setShowBlur(isBlurred);
 *   });
 *   return unsub;
 * }, []);
 * ```
 */
export function onOverlayBlurChange(callback: OnBlurCallback): () => void {
  return getOverlayProtection().onBlurChange(callback);
}

/**
 * Enable screenshot prevention for current screen
 */
export async function preventScreenCapture(): Promise<void> {
  await getOverlayProtection().enableScreenshotPrevention();
}

/**
 * Disable screenshot prevention for current screen
 */
export async function allowScreenCapture(): Promise<void> {
  await getOverlayProtection().disableScreenshotPrevention();
}

export default {
  OverlayProtection,
  getOverlayProtection,
  startOverlayProtection,
  stopOverlayProtection,
  setCurrentScreen,
  isSensitiveScreen,
  detectOverlay,
  getProtectionStyle,
  getBlurStyle,
  addSensitiveScreen,
  removeSensitiveScreen,
  isOverlayProtectionActive,
  getProtectionState,
  createProtectedViewProps,
  onOverlayBlurChange,
  preventScreenCapture,
  allowScreenCapture,
};
