import { useState, useEffect, useRef } from 'react';
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
  Dimensions,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  FadeInDown,
  FadeInUp,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { spacing, radius, typography } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/authStore';
import authApi from '../../src/api/auth';
import { toast } from '../../src/utils/toast';
import { hapticLight, hapticSelection, hapticHeavy } from '../../src/utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Animated floating orb for background ──
function FloatingOrb({
  x, y, size, color, delay,
}: {
  x: number; y: number; size: number; color: string; delay: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [-15, 15]);
    const translateX = interpolate(progress.value, [0, 0.5, 1], [0, 10, 0]);
    const scale = interpolate(progress.value, [0, 0.5, 1], [1, 1.1, 1]);
    return {
      transform: [{ translateY }, { translateX }, { scale }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

const inputStyles = StyleSheet.create({
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.input,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.md + 2,
    minHeight: 48,
  },
});

// ── Animated input with focus glow ──
function AnimatedInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoComplete,
  editable,
  rightElement,
  hasError,
  isDark,
  colors,
  delay = 0,
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoComplete?: any;
  editable?: boolean;
  rightElement?: React.ReactNode;
  hasError?: boolean;
  isDark: boolean;
  colors: any;
  delay?: number;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const handleFocus = () => {
    setIsFocused(true);
    focusProgress.value = withSpring(1, { stiffness: 300, damping: 20 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, { duration: 200 });
  };

  const wrapperStyle = useAnimatedStyle(() => {
    const borderColor = hasError
      ? colors.semantic.error
      : isFocused
        ? (isDark ? '#d6ed6a' : '#171717')
        : colors.border.default;

    const shadowOpacity = isFocused ? (isDark ? 0.3 : 0.08) : 0;
    const shadowRadius = isFocused ? 12 : 0;

    return {
      borderColor,
      shadowColor: isDark ? '#d6ed6a' : '#171717',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius,
      elevation: isFocused ? 4 : 0,
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(focusProgress.value, [0, 1], [1, 1.15]);
    return {
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(delay).springify()}>
      <Animated.View
        style={[
          inputStyles.inputWrapper,
          { backgroundColor: colors.bg.surface },
          !isDark && { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
          wrapperStyle,
        ]}
      >
        <Animated.View style={iconStyle}>
          <Ionicons
            name={icon as any}
            size={18}
            color={isFocused ? (isDark ? '#d6ed6a' : '#171717') : colors.text.tertiary}
          />
        </Animated.View>
        <TextInput
          style={[inputStyles.input, { color: colors.text.primary }]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="none"
        />
        {rightElement}
      </Animated.View>
    </Animated.View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, shadows, isDark } = useTheme();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isLoading;

  // Logo pulse animation
  const logoScale = useSharedValue(1);
  useEffect(() => {
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  // Button press animation
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleLogin = async () => {
    if (!canSubmit) return;
    hapticHeavy();
    clearError();
    btnScale.value = withSequence(
      withTiming(0.96, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    const success = await login({ loginId: email.trim().toLowerCase(), password });
    if (success) {
      router.replace('/(tabs)/dashboard');
    }
  };

  const styles = createStyles(colors, shadows, isDark);

  const gradientColors = isDark
    ? ['#0A0A0A', '#0f1a0a', '#0A0A0A']
    : ['#FAFAFA', '#f0f5ec', '#FAFAFA'];

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Animated gradient background */}
      <LinearGradient
        colors={gradientColors as [string, string, string]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle background shapes — NOT animated, clean */}

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Brand — animated entrance */}
        <Animated.View entering={FadeInDown.duration(600).delay(100).springify()} style={styles.brandSection}>
          <Animated.View style={[styles.logoCircle, logoStyle]}>
            <Ionicons name="briefcase-outline" size={28} color={isDark ? '#d6ed6a' : colors.text.primary} />
          </Animated.View>
          <Text style={styles.brandName}>Sliplly</Text>
          <Text style={styles.brandTagline}>Fleet Management</Text>
        </Animated.View>

        {/* Welcome Text — staggered */}
        <Animated.View entering={FadeInDown.duration(500).delay(200).springify()} style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome back</Text>
          <Text style={styles.welcomeSub}>Sign in to your account</Text>
        </Animated.View>

        {/* Error */}
        {error ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.semantic.error} />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        ) : null}

        {/* Form — staggered entrance */}
        <View style={styles.form}>
          {/* Email */}
          <AnimatedInput
            icon="mail-outline"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            editable={!isLoading}
            hasError={!!error}
            isDark={isDark}
            colors={colors}
            delay={300}
          />

          {/* Password */}
          <AnimatedInput
            icon="lock-closed-outline"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
            editable={!isLoading}
            hasError={!!error}
            isDark={isDark}
            colors={colors}
            delay={400}
            rightElement={
              <Pressable onPress={() => { hapticSelection(); setShowPassword(!showPassword); }} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.text.tertiary}
                />
              </Pressable>
            }
          />

          {/* Forgot Password */}
          <Animated.View entering={FadeInDown.duration(400).delay(500)}>
            <Pressable style={styles.forgotLink} onPress={async () => {
              hapticLight();
              if (!email.trim()) {
                toast.warning('Please enter your email first', 'Email Required');
                return;
              }
              try {
                await authApi.forgotPassword(email.trim().toLowerCase());
                toast.success('Password reset link sent to your email', 'Check Your Email');
              } catch (err: any) {
                toast.error(err?.message || 'Failed to send reset link', 'Error');
              }
            }}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          </Animated.View>

          {/* Login Button — animated */}
          <Animated.View entering={FadeInUp.duration(500).delay(550).springify()}>
            <Animated.View style={btnStyle}>
              <Pressable
                style={[
                  styles.primaryButton,
                  !canSubmit && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={!canSubmit}
              >
                {isLoading ? (
                  <ActivityIndicator color={isDark ? '#0A0A0A' : '#FFFFFF'} size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </Pressable>
            </Animated.View>
          </Animated.View>

          {/* Divider */}
          <Animated.View entering={FadeInDown.duration(400).delay(650)} style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* Signup Link */}
          <Animated.View entering={FadeInUp.duration(500).delay(700).springify()}>
            <Pressable style={styles.secondaryButton} onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.secondaryButtonText}>Create an account</Text>
            </Pressable>
          </Animated.View>
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
      justifyContent: 'center',
    },

    // Brand
    brandSection: {
      alignItems: 'center',
      marginBottom: spacing.xxxl,
    },
    logoCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: isDark ? '#1a1f0e' : colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(214, 237, 106, 0.2)' : colors.border.subtle,
    },
    brandName: {
      ...typography.h2,
      color: colors.text.primary,
      fontWeight: '700',
    },
    brandTagline: {
      ...typography.caption,
      color: colors.text.tertiary,
      marginTop: 2,
    },

    // Welcome
    welcomeSection: {
      marginBottom: spacing.xl,
    },
    welcomeTitle: {
      ...typography.h2,
      color: colors.text.primary,
      fontWeight: '700',
      marginBottom: 4,
    },
    welcomeSub: {
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

    forgotLink: {
      alignSelf: 'flex-end',
      marginTop: -spacing.xs,
    },
    forgotText: {
      ...typography.caption,
      color: isDark ? '#d6ed6a' : colors.text.secondary,
      fontWeight: '500',
    },

    // Buttons
    primaryButton: {
      backgroundColor: isDark ? '#d6ed6a' : '#171717',
      borderRadius: radius.button,
      paddingVertical: spacing.md + 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
      minHeight: 50,
      ...(!isDark ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3 } : {}),
    },
    primaryButtonText: {
      ...typography.button,
      color: isDark ? '#0A0A0A' : '#FFFFFF',
    },
    buttonDisabled: {
      opacity: 0.5,
    },

    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginVertical: spacing.sm,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border.subtle,
    },
    dividerText: {
      ...typography.caption,
      color: colors.text.tertiary,
    },

    secondaryButton: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.button,
      paddingVertical: spacing.md + 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border.default,
      minHeight: 50,
    },
    secondaryButtonText: {
      ...typography.button,
      color: colors.text.primary,
    },
  });
