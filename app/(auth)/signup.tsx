import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { spacing, radius, typography } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/authStore';
import { hapticHeavy, hapticSelection } from '../../src/utils/haptics';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, shadows, isDark } = useTheme();
  const { signup, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    agencyName: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const canSubmit =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.password.length >= 6 &&
    form.agencyName.trim().length > 0 &&
    !isLoading;

  const handleSignup = async () => {
    if (!canSubmit) return;
    hapticHeavy();
    clearError();
    const result = await signup({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      password: form.password,
      agencyName: form.agencyName.trim(),
    });
    if (result.success) {
      router.replace({ pathname: '/(auth)/verify-otp', params: { email: result.email || form.email.trim().toLowerCase() } });
    }
  };

  const styles = createStyles(colors, shadows, isDark);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text.primary} />
        </Pressable>

        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Set up your fleet management workspace</Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.semantic.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.form}>
          {/* Name Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>FIRST NAME</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  placeholderTextColor={colors.text.tertiary}
                  value={form.firstName}
                  onChangeText={(v) => update('firstName', v)}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>LAST NAME</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor={colors.text.tertiary}
                  value={form.lastName}
                  onChangeText={(v) => update('lastName', v)}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={colors.text.tertiary} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.text.tertiary}
                value={form.email}
                onChangeText={(v) => update('email', v)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PHONE</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color={colors.text.tertiary} />
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.text.tertiary}
                value={form.phone}
                onChangeText={(v) => update('phone', v)}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Agency Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>AGENCY NAME</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="business-outline" size={18} color={colors.text.tertiary} />
              <TextInput
                style={styles.input}
                placeholder="Your fleet agency"
                placeholderTextColor={colors.text.tertiary}
                value={form.agencyName}
                onChangeText={(v) => update('agencyName', v)}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.text.tertiary} />
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor={colors.text.tertiary}
                value={form.password}
                onChangeText={(v) => update('password', v)}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                editable={!isLoading}
              />
              <Pressable onPress={() => { hapticSelection(); setShowPassword(!showPassword); }} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.text.tertiary}
                />
              </Pressable>
            </View>
          </View>

          {/* Submit */}
          <Pressable
            style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={!canSubmit}
          >
            {isLoading ? (
              <ActivityIndicator color={isDark ? colors.text.inverse : '#fff'} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </Pressable>

          {/* Login Link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginHint}>Already have an account? </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any, shadows: any, isDark: boolean) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    scrollContent: {
      flexGrow: 1,
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
      marginBottom: spacing.xl,
    },
    title: {
      ...typography.h2,
      color: colors.text.primary,
      fontWeight: '700',
      marginBottom: 4,
    },
    subtitle: {
      ...typography.body,
      color: colors.text.secondary,
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

    // Form
    form: {
      gap: spacing.md,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    inputGroup: {
      gap: spacing.xs,
    },
    inputLabel: {
      ...typography.label,
      color: colors.text.tertiary,
      letterSpacing: 0.8,
      paddingLeft: 2,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.input,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      ...(!isDark ? shadows.low : {}),
    },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.text.primary,
      paddingVertical: spacing.md + 2,
      minHeight: 48,
    },

    // Buttons
    primaryButton: {
      backgroundColor: isDark ? colors.accent.primary : colors.accent.primary,
      borderRadius: radius.button,
      paddingVertical: spacing.md + 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
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

    loginRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    loginHint: {
      ...typography.body,
      color: colors.text.tertiary,
    },
    loginLink: {
      ...typography.bodyMedium,
      color: isDark ? colors.accent.primary : colors.text.primary,
      fontWeight: '600',
    },
  });
