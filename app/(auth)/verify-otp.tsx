import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { spacing, radius, typography } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/authStore';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email || '';

  const { colors, shadows, isDark } = useTheme();
  const { verifyOtp, resendOtp, isLoading, error, clearError } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    const digit = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit.slice(-1); // Take last digit if multiple pasted
    setOtp(newOtp);

    // Auto-advance
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((d) => d.length === 1) && newOtp.join('').length === OTP_LENGTH) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpValue?: string) => {
    const code = otpValue || otp.join('');
    if (code.length !== OTP_LENGTH || !email) return;
    clearError();
    const success = await verifyOtp(email, code);
    if (success) {
      router.replace('/(tabs)/dashboard');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    clearError();
    const success = await resendOtp(email);
    if (success) {
      setCooldown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const styles = createStyles(colors, shadows, isDark);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        {/* Back */}
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text.primary} />
        </Pressable>

        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark-outline" size={28} color={isDark ? colors.accent.primary : colors.text.primary} />
          </View>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.semantic.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* OTP Input */}
        <View style={styles.otpRow}>
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.otpBox,
                otp[index] ? styles.otpBoxFilled : null,
                index === otp.findIndex((d) => !d) ? styles.otpBoxActive : null,
              ]}
            >
              <TextInput
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={styles.otpInput}
                value={otp[index]}
                onChangeText={(v) => handleOtpChange(v, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isLoading}
              />
            </View>
          ))}
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={isDark ? colors.accent.primary : colors.text.primary} />
            <Text style={styles.loadingText}>Verifying...</Text>
          </View>
        )}

        {/* Resend */}
        <View style={styles.resendSection}>
          <Text style={styles.resendHint}>Didn't receive the code?</Text>
          <Pressable onPress={handleResend} disabled={cooldown > 0 || isLoading}>
            <Text style={[styles.resendLink, cooldown > 0 && styles.resendDisabled]}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </Text>
          </Pressable>
        </View>

        {/* Manual Verify Button */}
        <Pressable
          style={[styles.primaryButton, otp.join('').length !== OTP_LENGTH && styles.buttonDisabled]}
          onPress={() => handleVerify()}
          disabled={otp.join('').length !== OTP_LENGTH || isLoading}
        >
          <Text style={styles.primaryButtonText}>Verify</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any, shadows: any, isDark: boolean) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.xxl,
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.bg.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },

    // Header
    headerSection: {
      alignItems: 'center',
      marginBottom: spacing.xxxl,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: isDark ? colors.accent.dim : colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: isDark ? colors.accent.primary + '30' : colors.border.subtle,
    },
    title: {
      ...typography.h2,
      color: colors.text.primary,
      fontWeight: '700',
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.body,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    emailHighlight: {
      color: isDark ? colors.accent.primary : colors.text.primary,
      fontWeight: '600',
    },

    // Error
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.semantic.error + '12',
      borderWidth: 1,
      borderColor: colors.semantic.error + '30',
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    errorText: {
      ...typography.caption,
      color: colors.semantic.error,
      flex: 1,
    },

    // OTP Boxes
    otpRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    otpBox: {
      width: 48,
      height: 56,
      borderRadius: radius.md,
      backgroundColor: colors.bg.surface,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      alignItems: 'center',
      justifyContent: 'center',
      ...(!isDark ? shadows.low : {}),
    },
    otpBoxFilled: {
      borderColor: isDark ? colors.accent.primary : colors.text.primary,
      backgroundColor: isDark ? colors.accent.dim : colors.bg.overlay,
    },
    otpBoxActive: {
      borderColor: isDark ? colors.accent.primary : colors.text.primary,
    },
    otpInput: {
      ...typography.h2,
      color: colors.text.primary,
      fontWeight: '700',
      textAlign: 'center',
      width: '100%',
      height: '100%',
    },

    // Loading
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    loadingText: {
      ...typography.body,
      color: colors.text.secondary,
    },

    // Resend
    resendSection: {
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xxl,
    },
    resendHint: {
      ...typography.caption,
      color: colors.text.tertiary,
    },
    resendLink: {
      ...typography.bodyMedium,
      color: isDark ? colors.accent.primary : colors.text.primary,
      fontWeight: '600',
    },
    resendDisabled: {
      color: colors.text.tertiary,
    },

    // Button
    primaryButton: {
      backgroundColor: isDark ? colors.accent.primary : colors.accent.primary,
      borderRadius: radius.button,
      paddingVertical: spacing.md + 2,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
      ...(!isDark ? shadows.medium : {}),
    },
    primaryButtonText: {
      ...typography.button,
      color: isDark ? colors.text.inverse : '#FFFFFF',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });
