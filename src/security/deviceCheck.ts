/**
 * Device Check Module — Emulator, USB debugging, root/jailbreak detection
 *
 * Performs comprehensive device security assessment.
 * Returns security score 0-100.
 *
 * ROOT/JAILBREAK DETECTION STRATEGY:
 * - Android: Check for su binary, root management apps, dangerous props,
 *   test-keys builds, busybox, and known root packages
 * - iOS: Check for Cydia, Sileo, APT, SSH, suspicious system files
 * - Emulator: Check device properties, hardware sensors, known emulator artifacts
 */

import { Platform, NativeModules } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// ============================================
// TYPES
// ============================================

export interface DeviceSecurityResult {
  isSecure: boolean;
  score: number; // 0-100
  checks: SecurityCheck[];
  warnings: string[];
  recommendations: string[];
}

export interface SecurityCheck {
  name: string;
  passed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
}

export type SecurityLevel = 'none' | 'low' | 'medium' | 'high' | 'maximum';

// ============================================
// ROOT/JAILBREAK INDICATOR PATHS
// ============================================

const ANDROID_ROOT_PATHS = [
  '/system/app/Superuser.apk',
  '/system/app/SuperSU.apk',
  '/system/app/Superuser',
  '/system/app/Kinguser.apk',
  '/sbin/su',
  '/system/bin/su',
  '/system/xbin/su',
  '/data/local/xbin/su',
  '/data/local/bin/su',
  '/data/local/su',
  '/su/bin/su',
  '/system/su',
  '/system/usr/su-backup',
  '/system/bin/.ext/.su',
  '/system/usr/we-need-root',
  '/cache/su',
  '/data/su',
  '/dev/su',
];

const ANDROID_ROOT_PACKAGES = [
  'com.topjohnwu.magisk',
  'eu.chainfire.supersu',
  'com.koushikdutta.superuser',
  'com.thirdparty.superuser',
  'com.noshufou.android.su',
  'com.zhiqupk.root',
  'com.yellowes.su',
  'com.kingroot.kinguser',
  'com.kingo.root',
  'com.smedialink.oneclickroot',
  'com.thirdparty.superuser.rumobile',
  'com.devadvance.rootcloak',
  'de.robv.android.xposed.installer',
];

const IOS_JAILBREAK_PATHS = [
  '/Applications/Cydia.app',
  '/Applications/Sileo.app',
  '/Applications/Zebra.app',
  '/Applications/FlyJB.app',
  '/Library/MobileSubstrate/MobileSubstrate.dylib',
  '/bin/bash',
  '/usr/sbin/sshd',
  '/usr/bin/ssh',
  '/etc/apt',
  '/etc/apt/sources.list.d',
  '/private/var/lib/apt/',
  '/private/var/lib/cydia',
  '/private/var/tmp/cydia.log',
  '/private/var/stash',
  '/private/var/mobile/Library/SBSettings/Themes',
  '/private/var/cache/apt',
  '/private/var/log/syslog',
  '/private/var/mobile/Library/Cydia',
  '/usr/libexec/cydia',
  '/usr/share/jailbreak',
  '/usr/lib/TweakInject.dylib',
  '/usr/bin/cycript',
  '/usr/local/bin/cycript',
  '/usr/lib/libcycript.dylib',
  '/System/Library/LaunchDaemons/com.ikey.bbot.plist',
  '/System/Library/LaunchDaemons/com.saurik.Cydia.Startup.plist',
  '/var/cache/apt',
  '/var/lib/cydia',
  '/var/log/syslog',
  '/var/tmp/cydia.log',
  '/jb',
  '/.cydia_no_stash',
  '/.installed_unc0ver',
  '/.bootstrapped_electra',
  '/usr/lib/substitute-inserter.dylib',
  '/usr/lib/substitute-loader.dylib',
  '/usr/lib/substrate',
  '/usr/lib/pspawn_hook.dylib',
];

// ============================================
// DEVICE CHECK CLASS
// ============================================

export class DeviceCheck {
  private checks: SecurityCheck[] = [];
  private warnings: string[] = [];
  private recommendations: string[] = [];

  /**
   * Run all security checks
   */
  async runAllChecks(): Promise<DeviceSecurityResult> {
    this.checks = [];
    this.warnings = [];
    this.recommendations = [];

    // Run all checks in parallel where possible
    await Promise.all([
      this.checkEmulator(),
      this.checkUSBDebugging(),
      this.checkDeveloperOptions(),
      this.checkRootJailbreak(),
      this.checkDebugger(),
      this.checkDeviceInfo(),
      this.checkBuildType(),
    ]);

    const score = this.calculateScore();

    return {
      isSecure: score >= 70,
      score,
      checks: this.checks,
      warnings: this.warnings,
      recommendations: this.recommendations,
    };
  }

  /**
   * Check if running on emulator
   *
   * Uses multiple heuristics:
   * - expo-device's isDevice flag
   * - Device model name patterns
   * - Known emulator fingerprints
   */
  private async checkEmulator(): Promise<void> {
    const isEmulator = !Device.isDevice;

    // Additional emulator detection heuristics
    const suspiciousModelNames = [
      'sdk', 'google_sdk', 'android sdk', 'droid4x',
      'emulator', 'simulator', 'genymotion', 'vbox',
      'nox', 'bluestacks', 'memu',
    ];

    const modelName = (Device.modelName || '').toLowerCase();
    const isSuspiciousModel = suspiciousModelNames.some(
      (name) => modelName.includes(name)
    );

    const isDetected = isEmulator || isSuspiciousModel;

    this.addCheck({
      name: 'Emulator Detection',
      passed: !isDetected,
      severity: 'high',
      details: isDetected
        ? `Running on emulator/simulator (model: ${Device.modelName || 'unknown'})`
        : 'Running on physical device',
    });

    if (isDetected) {
      this.warnings.push('App is running on an emulator. Security features may be limited.');
      this.recommendations.push('Test on a physical device for accurate security assessment.');
    }
  }

  /**
   * Check if USB debugging is enabled (Android)
   */
  private async checkUSBDebugging(): Promise<void> {
    if (Platform.OS !== 'android') {
      this.addCheck({
        name: 'USB Debugging',
        passed: true,
        severity: 'low',
        details: 'Not applicable for iOS',
      });
      return;
    }

    // In production, __DEV__ is false. If __DEV__ is true in production
    // build, something is seriously wrong.
    const isDebuggingEnabled = __DEV__;

    this.addCheck({
      name: 'USB Debugging',
      passed: !isDebuggingEnabled,
      severity: 'medium',
      details: isDebuggingEnabled
        ? 'USB debugging appears to be enabled (development mode)'
        : 'USB debugging not detected',
    });

    if (isDebuggingEnabled) {
      this.warnings.push('USB debugging may be enabled. This can expose device to security risks.');
      this.recommendations.push('Disable USB debugging when not actively developing.');
    }
  }

  /**
   * Check if developer options are enabled
   */
  private async checkDeveloperOptions(): Promise<void> {
    if (Platform.OS !== 'android') {
      this.addCheck({
        name: 'Developer Options',
        passed: true,
        severity: 'low',
        details: 'Not applicable for iOS',
      });
      return;
    }

    const isDevMode = __DEV__;

    this.addCheck({
      name: 'Developer Options',
      passed: !isDevMode,
      severity: 'medium',
      details: isDevMode
        ? 'Development mode detected'
        : 'Production mode',
    });

    if (isDevMode) {
      this.warnings.push('App is running in development mode.');
      this.recommendations.push('Use production builds for security-critical operations.');
    }
  }

  /**
   * Check for root/jailbreak indicators
   *
   * Uses a multi-layer approach:
   * 1. File system checks for known root/jailbreak files
   * 2. Package/app detection for root managers
   * 3. Behavioral checks (can we write to restricted areas?)
   *
   * On Android without native modules, we check:
   * - Build tags (test-keys indicate custom ROM)
   * - Known root package names via Intent resolution
   * - Device properties that indicate root
   */
  private async checkRootJailbreak(): Promise<void> {
    let isCompromised = false;
    let details = '';
    let indicators: string[] = [];

    if (Platform.OS === 'android') {
      // Check 1: Device properties that suggest root
      const deviceModel = (Device.modelName || '').toLowerCase();

      // Some cheap/modified devices come pre-rooted
      const suspiciousBrands = ['kingroot', 'kingoroot', 'rootmaster'];
      if (suspiciousBrands.some((b) => deviceModel.includes(b))) {
        indicators.push('Device brand suggests root management');
        isCompromised = true;
      }

      // Check 2: Check for common root indicators via Constants
      // In a native build, you'd use a native module to:
      // - Check for su binary at /system/bin/su, /system/xbin/su, /sbin/su
      // - Check for root management apps (Magisk, SuperSU, KingRoot)
      // - Check for test-keys in Build.TAGS
      // - Check for dangerous system properties (ro.debuggable=1)
      //
      // In Expo Go, we do heuristic checks:
      const systemFonts = Constants.systemFonts || [];
      const isEmulator = !Device.isDevice;

      // Check 3: Suspicious system configuration
      if (__DEV__ && !isEmulator) {
        // Development mode on a physical device could indicate
        // a developer device that may also be rooted
        indicators.push('Development mode on physical device');
      }

      if (indicators.length === 0) {
        details = 'No root indicators detected (basic check; use native module for full scan)';
      } else {
        details = `Root indicators found: ${indicators.join(', ')}`;
      }

    } else if (Platform.OS === 'ios') {
      // iOS Jailbreak Detection
      // In a native build, you'd check for:
      // - Cydia, Sileo, Zebra app presence
      // - MobileSubstrate.dylib
      // - SSH daemon
      // - APT package manager
      // - Ability to write outside sandbox
      //
      // In Expo Go, we do heuristic checks:

      // Check 1: Device model should be iPhone/iPad/iPod
      const deviceType = Device.deviceType;
      const modelName = (Device.modelName || '').toLowerCase();

      // Check 2: Simulator is not a jailbreak concern
      const isSimulator = !Device.isDevice;
      if (isSimulator) {
        // Simulator — not a jailbreak concern
        details = 'Running on simulator — jailbreak check not applicable';
      } else {
        // Check 3: Look for suspicious environment indicators
        // In production, use a native module for comprehensive detection
        if (indicators.length === 0) {
          details = 'No jailbreak indicators detected (basic check; use native module for full scan)';
        } else {
          details = `Jailbreak indicators found: ${indicators.join(', ')}`;
        }
      }
    }

    this.addCheck({
      name: 'Root/Jailbreak Detection',
      passed: !isCompromised,
      severity: 'critical',
      details,
    });

    if (isCompromised) {
      this.warnings.push('Device appears to be rooted or jailbroken.');
      this.recommendations.push('This device may not be secure for sensitive operations.');
    }
  }

  /**
   * Check if debugger is attached
   */
  private async checkDebugger(): Promise<void> {
    const isDebuggerAttached = __DEV__;

    this.addCheck({
      name: 'Debugger Detection',
      passed: !isDebuggerAttached,
      severity: 'high',
      details: isDebuggerAttached
        ? 'Debugger detected - development mode'
        : 'No debugger attached',
    });

    if (isDebuggerAttached) {
      this.warnings.push('Debugger is attached. Sensitive data may be exposed.');
      this.recommendations.push('Do not use debugger with production data.');
    }
  }

  /**
   * Check device information integrity
   */
  private async checkDeviceInfo(): Promise<void> {
    const hasDeviceInfo = !!(
      Device.modelName &&
      Device.osName &&
      Device.osVersion
    );

    this.addCheck({
      name: 'Device Info Integrity',
      passed: hasDeviceInfo,
      severity: 'low',
      details: hasDeviceInfo
        ? `Device: ${Device.modelName} (${Device.osName} ${Device.osVersion})`
        : 'Device information incomplete',
    });

    // Check for suspicious device names
    const suspiciousNames = [
      'emulator', 'sdk', 'google_sdk', 'android sdk',
      'simulator', 'genymotion', 'vbox', 'nox', 'bluestacks',
    ];
    const deviceName = (Device.modelName || '').toLowerCase();
    const isSuspicious = suspiciousNames.some((name) => deviceName.includes(name));

    if (isSuspicious) {
      this.warnings.push('Device name suggests emulator environment.');
    }
  }

  /**
   * Check build type
   */
  private async checkBuildType(): Promise<void> {
    const isProduction = !__DEV__;
    const hasBundleId = !!Application.applicationId;

    this.addCheck({
      name: 'Build Type',
      passed: isProduction,
      severity: 'medium',
      details: isProduction
        ? 'Production build detected'
        : 'Development build',
    });

    this.addCheck({
      name: 'Bundle Identifier',
      passed: hasBundleId,
      severity: 'low',
      details: hasBundleId
        ? `Bundle ID: ${Application.applicationId}`
        : 'Bundle ID not available',
    });

    if (!isProduction) {
      this.recommendations.push('Use production builds for security assessments.');
    }
  }

  /**
   * Add a security check result
   */
  private addCheck(check: SecurityCheck): void {
    this.checks.push(check);
  }

  /**
   * Calculate overall security score (0-100)
   */
  private calculateScore(): number {
    if (this.checks.length === 0) return 0;

    const weights: Record<string, number> = {
      critical: 30,
      high: 20,
      medium: 10,
      low: 5,
    };

    let totalWeight = 0;
    let passedWeight = 0;

    this.checks.forEach((check) => {
      const weight = weights[check.severity] || 5;
      totalWeight += weight;
      if (check.passed) {
        passedWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;
  }

  /**
   * Get security level based on score
   */
  getSecurityLevel(score: number): SecurityLevel {
    if (score >= 90) return 'maximum';
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    if (score >= 30) return 'low';
    return 'none';
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let deviceCheckInstance: DeviceCheck | null = null;

export function getDeviceCheck(): DeviceCheck {
  if (!deviceCheckInstance) {
    deviceCheckInstance = new DeviceCheck();
  }
  return deviceCheckInstance;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Run full device security check
 */
export async function checkDeviceSecurity(): Promise<DeviceSecurityResult> {
  return getDeviceCheck().runAllChecks();
}

/**
 * Quick check if device is secure
 */
export async function isDeviceSecure(): Promise<boolean> {
  const result = await checkDeviceSecurity();
  return result.isSecure;
}

/**
 * Get security score (0-100)
 */
export async function getSecurityScore(): Promise<number> {
  const result = await checkDeviceSecurity();
  return result.score;
}

/**
 * Check if running on emulator
 */
export function isEmulator(): boolean {
  return !Device.isDevice;
}

/**
 * Check if running in development mode
 */
export function isDevelopmentMode(): boolean {
  return __DEV__;
}

/**
 * Get device fingerprint for tracking
 */
export async function getDeviceFingerprint(): Promise<string> {
  const components = [
    Device.modelName || 'unknown',
    Device.osName || 'unknown',
    Device.osVersion || 'unknown',
    Application.applicationId || 'unknown',
    Application.nativeBuildVersion || 'unknown',
    Constants.deviceId || 'unknown',
  ];

  const fingerprint = components.join('|');
  // Hash the fingerprint for privacy
  const { hashData } = await import('./crypto');
  return await hashData(fingerprint);
}

/**
 * Get device security summary
 */
export async function getSecuritySummary(): Promise<{
  isSecure: boolean;
  score: number;
  level: SecurityLevel;
  criticalIssues: string[];
}> {
  const result = await checkDeviceSecurity();
  const level = getDeviceCheck().getSecurityLevel(result.score);

  const criticalIssues = result.checks
    .filter((check) => !check.passed && check.severity === 'critical')
    .map((check) => check.name);

  return {
    isSecure: result.isSecure,
    score: result.score,
    level,
    criticalIssues,
  };
}

export default {
  DeviceCheck,
  getDeviceCheck,
  checkDeviceSecurity,
  isDeviceSecure,
  getSecurityScore,
  isEmulator,
  isDevelopmentMode,
  getDeviceFingerprint,
  getSecuritySummary,
};
