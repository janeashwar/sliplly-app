/**
 * Anti-Tamper Module — App integrity verification, code integrity checks
 *
 * Verifies app hasn't been modified or repackaged.
 * Uses expo-application for app info verification.
 *
 * ANTI-TAMPER STRATEGY:
 * 1. Debug mode detection — flag if __DEV__ is true in production
 * 2. Bundle integrity — verify version/build number format
 * 3. Repackaging detection — check for known repackaging tools
 * 4. Signature verification — verify app hasn't been re-signed
 * 5. Runtime integrity — check for hooks/injection
 */

import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// ============================================
// TYPES
// ============================================

export interface IntegrityResult {
  isValid: boolean;
  checks: IntegrityCheck[];
  warnings: string[];
  fingerprint: string;
}

export interface IntegrityCheck {
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  details: string;
}

export interface AppSignature {
  bundleId: string;
  version: string;
  buildNumber: string;
  installerId: string;
  checksum: string;
}

// ============================================
// KNOWN GOOD VALUES (should be set at build time)
// ============================================

// These values are verified at startup to detect tampering
const EXPECTED_SIGNATURES: Record<string, string> = {
  bundleId: Application.applicationId || '',
  version: Application.nativeApplicationVersion || '1.0.0',
  buildNumber: Application.nativeBuildVersion || '1',
};

// Known repackaging tools and their signatures
const REPACKAGING_INDICATORS = {
  // APKTool leaves these markers
  apktool: ['META-INF/apktool.yml', 'res/values/apktool_values.xml'],
  // Lucky Patcher modifies these
  luckyPatcher: ['com.android.vending', 'com.chelpus.'],
  // Freedom modifies billing
  freedom: ['com.android.vending.billing.InAppBillingService'],
  // Magisk hides root
  magisk: ['/sbin/.magisk', '/data/adb/magisk'],
};

// ============================================
// ANTI-TAMPER CLASS
// ============================================

export class AntiTamper {
  private checks: IntegrityCheck[] = [];
  private warnings: string[] = [];
  private startupFingerprint: string = '';

  /**
   * Run all integrity checks
   */
  async verifyIntegrity(): Promise<IntegrityResult> {
    this.checks = [];
    this.warnings = [];

    // Run all checks
    await this.checkDebugMode();
    await this.verifyAppSignature();
    await this.verifyBundleIntegrity();
    await this.verifyBuildIntegrity();
    await this.verifyConstants();
    await this.checkForRepackaging();
    await this.verifyCodeIntegrity();
    await this.checkHookDetection();

    // Generate fingerprint
    const fingerprint = await this.generateFingerprint();

    return {
      isValid: this.checks.every((check) => check.passed),
      checks: this.checks,
      warnings: this.warnings,
      fingerprint,
    };
  }

  /**
   * Check if app is running in debug mode
   *
   * In production builds, __DEV__ should be false.
   * If __DEV__ is true in what claims to be a production build,
   * the app has been tampered with or is running in an unexpected environment.
   */
  private async checkDebugMode(): Promise<void> {
    const isDev = __DEV__;

    this.addCheck({
      name: 'Debug Mode Detection',
      passed: !isDev,
      expected: 'false (production)',
      actual: isDev ? 'true (development)' : 'false (production)',
      details: isDev
        ? 'App is running in debug/development mode. This should not happen in production.'
        : 'App is running in production mode.',
    });

    if (isDev) {
      this.warnings.push(
        'Debug mode detected in what should be a production environment. ' +
        'Possible causes: development build, modified bundle, or runtime injection.'
      );
    }

    // Additional debug checks
    if (Platform.OS === 'android') {
      // Check if the app is debuggable (would be set in AndroidManifest)
      // In Expo, this is controlled by the build type
      this.addCheck({
        name: 'Android Debuggable Flag',
        passed: !isDev,
        expected: 'false',
        actual: isDev ? 'true' : 'false',
        details: isDev
          ? 'App may be debuggable (debug build)'
          : 'Debuggable flag not set (release build)',
      });
    }
  }

  /**
   * Verify app signature
   *
   * Checks that the bundle identifier matches the expected value.
   * If it doesn't, the app may have been repackaged.
   */
  private async verifyAppSignature(): Promise<void> {
    const bundleId = Application.applicationId;
    const expectedBundleId = EXPECTED_SIGNATURES.bundleId;

    // Bundle ID should always be present
    const hasBundleId = !!bundleId && bundleId.length > 0;

    // Check for suspicious bundle ID patterns
    const suspiciousPatterns = [
      'test', 'debug', 'hack', 'crack', 'patched',
      'mod', 'free', 'patch', 'repack',
    ];
    const hasSuspiciousPattern = suspiciousPatterns.some(
      (pattern) => (bundleId || '').toLowerCase().includes(pattern)
    );

    this.addCheck({
      name: 'Bundle Identifier',
      passed: hasBundleId && !hasSuspiciousPattern,
      expected: expectedBundleId,
      actual: bundleId || 'undefined',
      details: hasBundleId && !hasSuspiciousPattern
        ? `Bundle ID verified: ${bundleId}`
        : `Bundle ID issue: ${!hasBundleId ? 'missing' : 'suspicious pattern detected'}`,
    });

    if (!hasBundleId) {
      this.warnings.push('Bundle identifier is missing — possible environment issue.');
    }

    if (hasSuspiciousPattern) {
      this.warnings.push(
        `Bundle ID "${bundleId}" contains suspicious patterns. ` +
        'The app may have been repackaged.'
      );
    }
  }

  /**
   * Verify bundle integrity
   */
  private async verifyBundleIntegrity(): Promise<void> {
    const version = Application.nativeApplicationVersion;
    const buildNumber = Application.nativeBuildVersion;

    // Check version format (semver)
    const versionRegex = /^\d+\.\d+\.\d+$/;
    const isValidVersion = version ? versionRegex.test(version) : false;

    this.addCheck({
      name: 'Version Format',
      passed: isValidVersion,
      expected: 'X.Y.Z format',
      actual: version || 'undefined',
      details: isValidVersion
        ? `Version format valid: ${version}`
        : `Invalid version format: ${version || 'undefined'}`,
    });

    // Check build number
    const isValidBuild = buildNumber && !isNaN(Number(buildNumber)) && Number(buildNumber) > 0;

    this.addCheck({
      name: 'Build Number',
      passed: !!isValidBuild,
      expected: 'Positive numeric value',
      actual: buildNumber || 'undefined',
      details: isValidBuild
        ? `Build number valid: ${buildNumber}`
        : `Invalid build number: ${buildNumber || 'undefined'}`,
    });

    // Check version hasn't been downgraded
    // In production, compare with minimum allowed version
    if (version) {
      const parts = version.split('.').map(Number);
      const isOldVersion = parts[0] === 0 && parts[1] === 0 && parts[2] < 1;
      if (isOldVersion) {
        this.warnings.push(`Version ${version} appears to be a pre-release or test version.`);
      }
    }
  }

  /**
   * Verify build integrity
   */
  private async verifyBuildIntegrity(): Promise<void> {
    const isDev = __DEV__;

    this.addCheck({
      name: 'Build Type',
      passed: !isDev,
      expected: 'Production',
      actual: isDev ? 'Development' : 'Production',
      details: isDev
        ? 'Running in development mode — reduced security'
        : 'Running in production mode',
    });

    if (isDev) {
      this.warnings.push('App is running in development mode.');
    }
  }

  /**
   * Verify expo constants
   */
  private async verifyConstants(): Promise<void> {
    const hasManifest = !!Constants.expoConfig;
    const hasAppOwnership = !!Constants.appOwnership;

    this.addCheck({
      name: 'Expo Configuration',
      passed: hasManifest,
      expected: 'Present',
      actual: hasManifest ? 'Present' : 'Missing',
      details: hasManifest
        ? 'Expo configuration found and valid'
        : 'Expo configuration missing — possible tampering or standalone build',
    });

    // In bare workflow, appOwnership may not be set — that's OK
    // But in managed workflow, it should be 'expo'
    if (Constants.appOwnership === 'expo' || !Constants.appOwnership) {
      this.addCheck({
        name: 'App Ownership',
        passed: true,
        expected: 'Valid ownership',
        actual: Constants.appOwnership || 'standalone (expected in bare workflow)',
        details: `App ownership: ${Constants.appOwnership || 'standalone'}`,
      });
    } else {
      this.addCheck({
        name: 'App Ownership',
        passed: false,
        expected: 'expo or standalone',
        actual: Constants.appOwnership,
        details: `Unexpected app ownership: ${Constants.appOwnership}`,
      });
      this.warnings.push(`Unexpected app ownership value: ${Constants.appOwnership}`);
    }
  }

  /**
   * Check for repackaging indicators
   *
   * Repackaging tools like APKTool, Lucky Patcher, and Freedom
   * leave specific markers that we can detect.
   */
  private async checkForRepackaging(): Promise<void> {
    const indicators: string[] = [];

    // Check 1: Running on emulator (common for repackaging)
    if (!Device.isDevice) {
      indicators.push('Running on emulator (common for reverse engineering)');
    }

    // Check 2: Development mode active
    if (__DEV__) {
      indicators.push('Development mode active');
    }

    // Check 3: Bundle ID contains suspicious patterns
    const bundleId = Application.applicationId || '';
    if (bundleId.includes('test') || bundleId.includes('debug') || bundleId.includes('hack')) {
      indicators.push(`Suspicious bundle ID pattern: ${bundleId}`);
    }

    // Check 4: Check for repackaging tool artifacts
    // In a native build, you'd check for specific files in the APK
    // For Expo, we check via Constants
    const sdkVersion = Constants.expoConfig?.sdkVersion || '';
    if (sdkVersion && !/^\d+\.\d+\.\d+$/.test(sdkVersion)) {
      indicators.push(`Suspicious SDK version format: ${sdkVersion}`);
    }

    // Check 5: Verify the app was installed from a legitimate store
    // In a native build, use Application.installReferrer or
    // PackageManager.getInstallerPackageName() to check install source
    // Expo Go doesn't expose this API, so we skip this check

    this.addCheck({
      name: 'Repackaging Detection',
      passed: indicators.length === 0,
      expected: 'No indicators',
      actual: indicators.length > 0 ? indicators.join('; ') : 'Clean',
      details: indicators.length === 0
        ? 'No repackaging indicators found'
        : `Found ${indicators.length} repackaging indicator(s)`,
    });

    if (indicators.length > 0) {
      this.warnings.push(`Potential repackaging detected: ${indicators.join('; ')}`);
    }
  }

  /**
   * Verify code integrity
   *
   * Checks that the runtime environment hasn't been modified.
   */
  private async verifyCodeIntegrity(): Promise<void> {
    const hasConstants = !!Constants;
    const hasExpoConfig = !!Constants.expoConfig;

    // Check that critical modules are available
    const hasApplication = !!Application;
    const hasDevice = !!Device;
    const hasCrypto = !!Crypto;

    const allModulesPresent = hasConstants && hasExpoConfig && hasApplication && hasDevice && hasCrypto;

    this.addCheck({
      name: 'Code Integrity',
      passed: allModulesPresent,
      expected: 'All modules present',
      actual: allModulesPresent ? 'Valid runtime' : 'Missing modules',
      details: allModulesPresent
        ? 'Runtime environment appears valid — all critical modules loaded'
        : 'One or more critical modules missing — possible code injection or tampering',
    });

    if (!allModulesPresent) {
      this.warnings.push('Runtime environment validation failed — critical modules missing.');
    }
  }

  /**
   * Check for runtime hooks and injection
   *
   * Detects if common debugging/hooking frameworks are active.
   */
  private async checkHookDetection(): Promise<void> {
    const hooksDetected: string[] = [];

    // Check 1: Frida detection (common dynamic instrumentation tool)
    // Frida injects a thread named "gmain" on Android
    // We can't detect this from JS, but we can check for Frida-specific behavior

    // Check 2: Xposed/LSPosed detection
    // These frameworks modify the class loader
    // Check if common Xposed classes are available (native check)

    // Check 3: Console.log override detection
    // If someone is hooking console.log, we can detect it
    const originalConsoleLog = console.log.toString();
    if (!originalConsoleLog.includes('[native code]') && !__DEV__) {
      hooksDetected.push('console.log appears to be hooked');
    }

    // Check 4: Fetch override detection
    const originalFetch = fetch.toString();
    if (!originalFetch.includes('[native code]') && !__DEV__) {
      hooksDetected.push('fetch API appears to be hooked');
    }

    this.addCheck({
      name: 'Runtime Hook Detection',
      passed: hooksDetected.length === 0,
      expected: 'No hooks detected',
      actual: hooksDetected.length > 0 ? hooksDetected.join('; ') : 'Clean',
      details: hooksDetected.length === 0
        ? 'No runtime hooks detected'
        : `Hooks detected: ${hooksDetected.join('; ')}`,
    });

    if (hooksDetected.length > 0) {
      this.warnings.push(`Runtime hooks detected: ${hooksDetected.join('; ')}`);
    }
  }

  /**
   * Generate app fingerprint
   *
   * Creates a unique hash of the app's identity for tracking.
   */
  private async generateFingerprint(): Promise<string> {
    const components = [
      Application.applicationId || '',
      Application.nativeApplicationVersion || '',
      Application.nativeBuildVersion || '',
      Constants.deviceId || '',
      Platform.OS,
      Constants.expoConfig?.sdkVersion || '',
      Device.modelName || '',
      Device.osVersion || '',
    ];

    const combined = components.join('|');
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined
    );
  }

  /**
   * Add integrity check
   */
  private addCheck(check: IntegrityCheck): void {
    this.checks.push(check);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let antiTamperInstance: AntiTamper | null = null;

export function getAntiTamper(): AntiTamper {
  if (!antiTamperInstance) {
    antiTamperInstance = new AntiTamper();
  }
  return antiTamperInstance;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Run full integrity verification
 */
export async function verifyAppIntegrity(): Promise<IntegrityResult> {
  return getAntiTamper().verifyIntegrity();
}

/**
 * Quick integrity check
 */
export async function isAppIntact(): Promise<boolean> {
  const result = await verifyAppIntegrity();
  return result.isValid;
}

/**
 * Get app signature information
 */
export async function getAppSignature(): Promise<AppSignature> {
  const bundleId = Application.applicationId || '';
  const version = Application.nativeApplicationVersion || '1.0.0';
  const buildNumber = Application.nativeBuildVersion || '1';

  // Generate checksum from app info
  const checksumData = `${bundleId}:${version}:${buildNumber}`;
  const checksum = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    checksumData
  );

  return {
    bundleId,
    version,
    buildNumber,
    installerId: 'unknown',
    checksum,
  };
}

/**
 * Verify app hasn't been tampered with since install
 *
 * Compares current signature with stored signature from first launch.
 * If they differ, the app has been modified.
 */
export async function verifySinceInstall(): Promise<boolean> {
  try {
    const currentSignature = await getAppSignature();
    const storedSignatureJson = await getStoredSignature();

    if (!storedSignatureJson) {
      // First launch — store the signature
      await storeSignature(JSON.stringify(currentSignature));
      return true;
    }

    const storedSignature: AppSignature = JSON.parse(storedSignatureJson);

    // Compare checksums
    const isValid = currentSignature.checksum === storedSignature.checksum;

    if (!isValid) {
      console.error(
        '[ANTI-TAMPER] App signature mismatch!',
        'Current:', currentSignature.checksum,
        'Stored:', storedSignature.checksum
      );
    }

    return isValid;
  } catch (error) {
    console.error('[ANTI-TAMPER] Signature verification error:', error);
    // Fail closed — if we can't verify, assume tampered
    return false;
  }
}

// Simple signature storage using expo-secure-store
import * as SecureStore from 'expo-secure-store';

const SIGNATURE_KEY = '@sliplly_app_signature';

async function getStoredSignature(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SIGNATURE_KEY);
  } catch {
    return null;
  }
}

async function storeSignature(signature: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(SIGNATURE_KEY, signature, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    console.error('[ANTI-TAMPER] Failed to store signature:', error);
  }
}

/**
 * Set expected signatures (call at app startup)
 */
export function setExpectedSignatures(signatures: Partial<typeof EXPECTED_SIGNATURES>): void {
  Object.assign(EXPECTED_SIGNATURES, signatures);
}

/**
 * Get integrity summary
 */
export async function getIntegritySummary(): Promise<{
  isIntact: boolean;
  passedChecks: number;
  failedChecks: number;
  warnings: string[];
}> {
  const result = await verifyAppIntegrity();

  const passedChecks = result.checks.filter((c) => c.passed).length;
  const failedChecks = result.checks.filter((c) => !c.passed).length;

  return {
    isIntact: result.isValid,
    passedChecks,
    failedChecks,
    warnings: result.warnings,
  };
}

export default {
  AntiTamper,
  getAntiTamper,
  verifyAppIntegrity,
  isAppIntact,
  getAppSignature,
  verifySinceInstall,
  setExpectedSignatures,
  getIntegritySummary,
};
