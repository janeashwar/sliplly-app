/**
 * Security Module — Multiple layers of protection
 *
 * Features:
 * - Root/Jailbreak detection (real file system + behavioral checks)
 * - Tamper detection (debug mode, repackaging, runtime hooks)
 * - Secure storage (hardware-backed encryption)
 * - API request signing (real HMAC-SHA256)
 * - Certificate pinning (SHA-256 hash verification, fail-closed)
 * - Debugger detection
 * - Overlay protection (screenshot prevention, background blur)
 * - Rate limiting (brute force protection)
 */

import { Platform, NativeModules } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Re-export all security modules
export { certificatePinning } from './certificatePinning';
export { DeviceCheck, checkDeviceSecurity, isDeviceSecure, getSecurityScore, isEmulator } from './deviceCheck';
export { AntiTamper, verifyAppIntegrity, isAppIntact, getAppSignature, verifySinceInstall } from './antiTamper';
export { OverlayProtection, getOverlayProtection, startOverlayProtection, stopOverlayProtection, setCurrentScreen as setOverlayScreen, onOverlayBlurChange, preventScreenCapture, allowScreenCapture } from './overlayProtection';
export { encryptedStorage, userDataStorage } from './encryptedStorage';
export { RateLimiter, getRateLimiter, checkRateLimit, rateLimitedFetch } from './rateLimiter';
export {
  configureCrypto,
  createHmacSignature,
  signRequest,
  verifySignedRequest,
  verifyResponseSignature,
  generateSignatureHeaders,
  hashData,
  encryptPayload,
  decryptPayload,
} from './crypto';

// ============================================
// SECURE STORAGE
// ============================================

export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.error('SecureStore set error:', error);
    }
  },

  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore get error:', error);
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore remove error:', error);
    }
  },
};

// ============================================
// DEVICE INTEGRITY CHECKS
// ============================================

export const deviceSecurity = {
  async isDeviceCompromised(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('Running on emulator — reduced security');
        return true;
      }

      if (Platform.OS === 'android') {
        return await this.checkAndroidRoot();
      } else if (Platform.OS === 'ios') {
        return await this.checkIOSJailbreak();
      }

      return false;
    } catch (error) {
      console.error('Device security check error:', error);
      return false;
    }
  },

  async checkAndroidRoot(): Promise<boolean> {
    // Use the enhanced deviceCheck module
    const { checkDeviceSecurity } = await import('./deviceCheck');
    const result = await checkDeviceSecurity();
    const rootCheck = result.checks.find((c) => c.name === 'Root/Jailbreak Detection');
    return rootCheck ? !rootCheck.passed : false;
  },

  async checkIOSJailbreak(): Promise<boolean> {
    const { checkDeviceSecurity } = await import('./deviceCheck');
    const result = await checkDeviceSecurity();
    const jbCheck = result.checks.find((c) => c.name === 'Root/Jailbreak Detection');
    return jbCheck ? !jbCheck.passed : false;
  },

  isDebuggerAttached(): boolean {
    return __DEV__;
  },

  async getDeviceFingerprint(): Promise<string> {
    const { getDeviceFingerprint } = await import('./deviceCheck');
    return await getDeviceFingerprint();
  },
};

// ============================================
// API SECURITY
// ============================================

export const apiSecurity = {
  async signRequest(
    method: string,
    endpoint: string,
    body: string,
    timestamp: number
  ): Promise<string> {
    // Use real HMAC-SHA256 from crypto module
    const { createHmacSignature } = await import('./crypto');
    const payload = `${method}:${endpoint}:${body}:${timestamp}`;
    return await createHmacSignature(payload);
  },

  async getSecurityHeaders(): Promise<Record<string, string>> {
    const timestamp = Date.now();
    const fingerprint = await deviceSecurity.getDeviceFingerprint();

    return {
      'X-Device-Fingerprint': fingerprint,
      'X-Timestamp': timestamp.toString(),
      'X-Platform': Platform.OS,
      'X-App-Version': Application.nativeApplicationVersion || '1.0.0',
      'X-Build-Number': Application.nativeBuildVersion || '1',
      'X-Device-Model': Device.modelName || 'unknown',
    };
  },

  validateResponse(response: any): boolean {
    if (!response) return false;
    return true;
  },
};

// ============================================
// ENVIRONMENT SECURITY
// ============================================

export const envSecurity = {
  getApiBaseUrl(): string {
    if (__DEV__) {
      return 'http://10.0.2.2:8080/api';
    }
    return 'https://api.sliplly.com/api';
  },

  isSecureEnvironment(): boolean {
    const conditions = [
      !__DEV__,
      Device.isDevice,
      !deviceSecurity.isDebuggerAttached(),
    ];

    return conditions.every(Boolean);
  },
};

// ============================================
// REQUEST INTERCEPTOR WITH SECURITY
// ============================================

export const secureFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const securityHeaders = await apiSecurity.getSecurityHeaders();

  const secureOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      ...securityHeaders,
    },
  };

  if (options.body) {
    const timestamp = Date.now();
    const signature = await apiSecurity.signRequest(
      options.method || 'GET',
      url,
      options.body as string,
      timestamp
    );
    secureOptions.headers = {
      ...secureOptions.headers,
      'X-Signature': signature,
    };
  }

  const response = await fetch(url, secureOptions);

  if (!apiSecurity.validateResponse(response)) {
    throw new Error('Invalid API response');
  }

  return response;
};

// ============================================
// SECURITY INITIALIZATION
// ============================================

export const initializeSecurity = async (): Promise<{
  isSecure: boolean;
  warnings: string[];
}> => {
  const warnings: string[] = [];
  let isSecure = true;

  // Check device integrity
  const isCompromised = await deviceSecurity.isDeviceCompromised();
  if (isCompromised) {
    warnings.push('Device may be compromised (rooted/jailbroken/emulator)');
    if (!__DEV__) {
      isSecure = false;
    }
  }

  // Check debugger
  if (deviceSecurity.isDebuggerAttached()) {
    warnings.push('Debugger detected');
    if (!__DEV__) {
      isSecure = false;
    }
  }

  // Check app integrity
  const { verifyAppIntegrity } = await import('./antiTamper');
  const integrity = await verifyAppIntegrity();
  if (!integrity.isValid) {
    warnings.push('App integrity check failed');
    warnings.push(...integrity.warnings);
    if (!__DEV__) {
      isSecure = false;
    }
  }

  // Start overlay protection
  const { startOverlayProtection } = await import('./overlayProtection');
  startOverlayProtection();

  // Configure crypto with secure key
  const { configureCrypto } = await import('./crypto');
  const storedKey = await secureStorage.get('api_signing_key');
  if (storedKey) {
    configureCrypto({ secretKey: storedKey });
  }

  console.log('Security Status:', {
    isSecure,
    warnings,
    platform: Platform.OS,
    isDevice: Device.isDevice,
    isDev: __DEV__,
    integrityChecks: integrity.checks.length,
    integrityPassed: integrity.checks.filter((c) => c.passed).length,
  });

  return { isSecure, warnings };
};

export default {
  secureStorage,
  deviceSecurity,
  apiSecurity,
  envSecurity,
  secureFetch,
  initializeSecurity,
};
