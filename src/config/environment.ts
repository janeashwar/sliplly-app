/**
 * Environment Configuration — Secure API management + environment-aware config
 *
 * NEVER commit actual API keys or secrets to source control!
 * Use environment variables or EAS secrets.
 *
 * Production values come from eas.json env vars or Expo Constants.
 * Development values are hardcoded for emulator/simulator.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get environment from Expo config or EAS env
type AppEnv = 'development' | 'staging' | 'production';

const ENV: AppEnv =
  (Constants.expoConfig?.extra?.appEnv as AppEnv) ||
  (Constants.expoConfig?.extra?.eas?.projectId &&
  Constants.expoConfig.extra.eas.projectId !== 'your-project-id'
    ? 'production'
    : __DEV__
    ? 'development'
    : 'production');

// ============================================
// API CONFIGURATION
// ============================================

export const API_CONFIG = {
  development: {
    baseUrl: 'https://sliplly.com/api/v1',
  },
  staging: {
    baseUrl: 'https://sliplly.com/api/v1',
  },
  production: {
    baseUrl: 'https://sliplly.com/api/v1',
  },
};

export const getApiConfig = () => {
  return API_CONFIG[ENV] || API_CONFIG.development;
};

// ============================================
// APP CONFIGURATION
// ============================================

export const APP_CONFIG = {
  name: 'Sliplly',
  version: Constants.expoConfig?.version || '1.0.0',
  buildNumber: Platform.OS === 'ios'
    ? (Constants.expoConfig?.ios?.buildNumber || '1')
    : String(Constants.expoConfig?.android?.versionCode || 1),
  environment: ENV,

  // Security settings
  security: {
    enableRootDetection: ENV === 'production',
    enableTamperDetection: ENV === 'production',
    enableCertificatePinning: ENV === 'production',
    enableRequestSigning: ENV === 'production',
  },

  // API settings
  api: {
    timeout: ENV === 'production' ? 30000 : 60000,
    retryAttempts: ENV === 'production' ? 3 : 1,
    retryDelay: 1000,
  },

  // Token settings
  token: {
    accessTokenKey: '@sliplly_access_token',
    refreshTokenKey: '@sliplly_refresh_token',
    refreshThreshold: 60000, // Refresh 60 seconds before expiry
  },

  // Cache settings
  cache: {
    ttlMs: ENV === 'production' ? 15 * 60 * 1000 : 5 * 60 * 1000, // 15min prod, 5min dev
    maxBytes: 5 * 1024 * 1024, // 5MB
  },
};

// ============================================
// FEATURE FLAGS
// ============================================

export const FEATURES = {
  enableBiometrics: false,
  enablePushNotifications: true,
  enableOfflineMode: true,
  enableAnalytics: ENV === 'production',
  enableCrashReporting: ENV === 'production',
  enablePerformanceMonitoring: ENV === 'production',
  enableDevTools: ENV === 'development',
};

// ============================================
// BUILD INFO
// ============================================

export const BUILD_INFO = {
  env: ENV,
  platform: Platform.OS,
  appVersion: APP_CONFIG.version,
  buildNumber: APP_CONFIG.buildNumber,
  isDev: __DEV__,
  projectId: Constants.expoConfig?.extra?.eas?.projectId || 'unknown',
  runtimeVersion: Constants.expoConfig?.runtimeVersion || 'unknown',
};

export default {
  ENV,
  API_CONFIG,
  APP_CONFIG,
  FEATURES,
  BUILD_INFO,
  getApiConfig,
};
