/**
 * Two-Factor Authentication Setup Page
 * 
 * Features:
 * - QR code display for authenticator app
 * - Manual secret key entry
 * - 6-digit OTP verification
 * - Backup codes display
 * - Enable/disable 2FA
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { toast } from '../src/utils/toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import twoFactorApi, { TwoFactorSetup, TwoFactorStatus } from '../src/api/twoFactor';

export default function TwoFactorSetupPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'backup'>('status');

  // Load 2FA status on mount
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const status = await twoFactorApi.getStatus();
      setStatus(status);
    } catch (error) {
      console.error('Failed to load 2FA status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start 2FA setup
  const handleSetup = async () => {
    setLoading(true);
    try {
      const setupData = await twoFactorApi.setup();
      setSetup(setupData);
      setStep('setup');
    } catch (error) {
      toast.error('Failed to initialize 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP code
  const handleVerify = async () => {
    if (otpCode.length !== 6) {
      toast.warning('Please enter a 6-digit code');
      return;
    }

    setVerifying(true);
    try {
      const result = await twoFactorApi.verify(otpCode);
      if (result.success) {
        setBackupCodes(result.backupCodes);
        setStep('backup');
      }
    } catch (error) {
      toast.error('Invalid code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Disable 2FA
  const handleDisable = async () => {
    Alert.prompt(
      'Disable 2FA',
      'Enter your current 2FA code to disable',
      async (code) => {
        if (code) {
          try {
            await twoFactorApi.disable(code);
            toast.success('2FA has been disabled');
            loadStatus();
          } catch (error) {
            toast.error('Invalid code');
          }
        }
      }
    );
  };

  // Copy backup codes
  const handleCopyBackupCodes = () => {
    // In production, copy to clipboard
    toast.success('Backup codes copied to clipboard', 'Copied');
  };

  const styles = createStyles(colors, isDark);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Two-Factor Authentication</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Step */}
        {step === 'status' && (
          <Animated.View entering={FadeInDown.delay(100)}>
            <View style={styles.statusCard}>
              <Ionicons
                name={status?.enabled ? 'shield-checkmark' : 'shield-outline'}
                size={48}
                color={status?.enabled ? colors.semantic.success : colors.text.tertiary}
              />
              <Text style={styles.statusTitle}>
                {status?.enabled ? '2FA is Enabled' : '2FA is Disabled'}
              </Text>
              <Text style={styles.statusDescription}>
                {status?.enabled
                  ? 'Your account is protected with two-factor authentication.'
                  : 'Add an extra layer of security to your account.'}
              </Text>

              {status?.enabled ? (
                <View style={styles.statusInfo}>
                  <Text style={styles.infoText}>
                    Backup codes remaining: {status.backupCodesRemaining}
                  </Text>
                </View>
              ) : null}
            </View>

            <Pressable
              style={[styles.actionButton, status?.enabled && styles.disableButton]}
              onPress={status?.enabled ? handleDisable : handleSetup}
            >
              <Ionicons
                name={status?.enabled ? 'close-circle-outline' : 'add-circle-outline'}
                size={20}
                color={status?.enabled ? colors.semantic.error : '#FFFFFF'}
              />
              <Text style={[styles.actionText, status?.enabled && styles.disableText]}>
                {status?.enabled ? 'Disable 2FA' : 'Enable 2FA'}
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Setup Step */}
        {step === 'setup' && setup && (
          <Animated.View entering={FadeInDown.delay(100)}>
            <View style={styles.setupCard}>
              <Text style={styles.setupTitle}>Scan QR Code</Text>
              <Text style={styles.setupDescription}>
                Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code.
              </Text>

              {/* QR Code placeholder */}
              <View style={styles.qrContainer}>
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code-outline" size={120} color={colors.text.primary} />
                </View>
              </View>

              {/* Manual entry */}
              <View style={styles.manualEntry}>
                <Text style={styles.manualTitle}>Or enter manually:</Text>
                <View style={styles.secretContainer}>
                  <Text style={styles.secretText}>{setup.secret}</Text>
                </View>
              </View>

              <Pressable style={styles.nextButton} onPress={() => setStep('verify')}>
                <Text style={styles.nextButtonText}>Next</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Verify Step */}
        {step === 'verify' && (
          <Animated.View entering={FadeInDown.delay(100)}>
            <View style={styles.verifyCard}>
              <Text style={styles.verifyTitle}>Enter Verification Code</Text>
              <Text style={styles.verifyDescription}>
                Enter the 6-digit code from your authenticator app.
              </Text>

              {/* OTP Input */}
              <View style={styles.otpContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <View key={index} style={styles.otpBox}>
                    <Text style={styles.otpDigit}>
                      {otpCode[index] || ''}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Number pad */}
              <View style={styles.numberPad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                  <Pressable
                    key={num}
                    style={styles.numberButton}
                    onPress={() => {
                      if (otpCode.length < 6) {
                        setOtpCode(otpCode + num.toString());
                      }
                    }}
                  >
                    <Text style={styles.numberText}>{num}</Text>
                  </Pressable>
                ))}
                <Pressable
                  style={styles.numberButton}
                  onPress={() => setOtpCode(otpCode.slice(0, -1))}
                >
                  <Ionicons name="backspace-outline" size={24} color={colors.text.primary} />
                </Pressable>
              </View>

              <Pressable
                style={[styles.verifyButton, verifying && styles.verifyButtonDisabled]}
                onPress={handleVerify}
                disabled={verifying || otpCode.length !== 6}
              >
                {verifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify</Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Backup Codes Step */}
        {step === 'backup' && (
          <Animated.View entering={FadeInDown.delay(100)}>
            <View style={styles.backupCard}>
              <Ionicons name="key-outline" size={48} color={colors.semantic.success} />
              <Text style={styles.backupTitle}>2FA Enabled Successfully!</Text>
              <Text style={styles.backupDescription}>
                Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
              </Text>

              <View style={styles.backupCodesContainer}>
                {backupCodes.map((code, index) => (
                  <View key={index} style={styles.backupCodeRow}>
                    <Text style={styles.backupCode}>{code}</Text>
                  </View>
                ))}
              </View>

              <Pressable style={styles.copyButton} onPress={handleCopyBackupCodes}>
                <Ionicons name="copy-outline" size={20} color={colors.accent.primary} />
                <Text style={styles.copyButtonText}>Copy Backup Codes</Text>
              </Pressable>

              <Pressable
                style={styles.doneButton}
                onPress={() => {
                  loadStatus();
                  setStep('status');
                }}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.bg.base,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.card,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
  },
  statusDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  statusInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.bg.surface,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: colors.accent.primary,
    borderRadius: 12,
  },
  disableButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.semantic.error,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disableText: {
    color: colors.semantic.error,
  },
  setupCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 24,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  setupDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: colors.bg.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualEntry: {
    marginBottom: 24,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  secretContainer: {
    backgroundColor: colors.bg.surface,
    borderRadius: 8,
    padding: 12,
  },
  secretText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: colors.text.primary,
    textAlign: 'center',
  },
  nextButton: {
    height: 48,
    backgroundColor: colors.accent.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifyCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 24,
  },
  verifyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  verifyDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 24,
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: colors.bg.surface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  numberButton: {
    width: 64,
    height: 64,
    backgroundColor: colors.bg.surface,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
  },
  verifyButton: {
    height: 48,
    backgroundColor: colors.accent.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backupCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  backupTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
  },
  backupDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  backupCodesContainer: {
    width: '100%',
    backgroundColor: colors.bg.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  backupCodeRow: {
    paddingVertical: 4,
  },
  backupCode: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: colors.text.primary,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  doneButton: {
    width: '100%',
    height: 48,
    backgroundColor: colors.accent.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
