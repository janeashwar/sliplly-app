/**
 * Expo App Config — Dynamic configuration for Sliplly
 *
 * Uses environment variables for production secrets.
 * Falls back to development defaults when running locally.
 */

import { ExpoConfig, ConfigContext } from 'expo/config';

const ENV = process.env.APP_ENV || 'development';

const config: ExpoConfig = {
  name: 'Sliplly',
  slug: 'sliplly',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  scheme: 'sliplly',
  newArchEnabled: true,

  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0A0A',
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.sliplly.app',
    buildNumber: process.env.IOS_BUILD_NUMBER || '1',
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      NSCameraUsageDescription: 'Sliplly needs camera access to scan QR codes for trip verification.',
      NSPhotoLibraryUsageDescription: 'Sliplly needs photo library access to upload profile pictures and documents.',
      NSLocationWhenInUseUsageDescription: 'Sliplly uses your location to track trip routes and show nearby drivers.',
      UIBackgroundModes: ['fetch', 'remote-notification'],
    },
  },

  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0A0A0A',
    },
    package: 'com.sliplly.app',
    versionCode: parseInt(process.env.ANDROID_VERSION_CODE || '1', 10),
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.VIBRATE',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.POST_NOTIFICATIONS',
    ],
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
  },

  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },

  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    'expo-splash-screen',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#0A0A0A',
      },
    ],
  ],

  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID || 'your-project-id',
    },
    appEnv: ENV,
  },

  // Runtime version policy — auto-increments on native changes
  runtimeVersion: {
    policy: 'appVersion',
  },

  // OTA updates
  updates: {
    url: process.env.EXPO_UPDATES_URL || 'https://u.expo.dev/your-project-id',
    enabled: ENV === 'production',
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 30000,
  },
};

export default ({ configContext }: { configContext: ConfigContext }) => {
  return config;
};
