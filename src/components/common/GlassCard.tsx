/**
 * GlassCard — Solid surface card (Notion/Linear style)
 *
 * Formerly a glassmorphism card with LinearGradient + optional BlurView.
 * Now renders a fully opaque themed surface with a hairline border and
 * warm-tinted shadow. Same props API, so no call-site changes needed.
 * Solid colors are cheaper to render than gradients/blur — better for 60fps
 * on low-end Android devices.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'hero' | 'stat' | 'activity' | 'elevated';
  /** Deprecated: blur was removed. Kept for prop compatibility. */
  intensity?: number;
  /** Deprecated: blur was removed. Kept for prop compatibility. */
  showBlur?: boolean;
}

function GlassCardInner({
  children,
  style,
  variant = 'default',
}: GlassCardProps) {
  const { isDark, colors } = useTheme();

  return (
    <View style={[styles.container, getSurface(variant, colors, isDark), getShadow(variant, isDark), style]}>
      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

export default React.memo(GlassCardInner);

type ThemeColors = ReturnType<typeof useTheme>['colors'];

function getSurface(variant: string, colors: ThemeColors, isDark: boolean): ViewStyle {
  const base: ViewStyle = {
    backgroundColor: isDark ? '#1C1C1E' : colors.bg.surface,
    borderWidth: 1,
    borderColor: isDark ? '#2C2C2E' : colors.border.subtle,
  };

  switch (variant) {
    case 'hero':
      // Hero keeps accent-tinted surface on light theme
      return { ...base, backgroundColor: isDark ? '#22231D' : colors.bg.surface };
    default:
      return base;
  }
}

function getShadow(variant: string, isDark: boolean): ViewStyle {
  // Warm-tinted shadow color (not pure black)
  const shadowColor = isDark ? '#000' : '#2C2C2E';

  switch (variant) {
    case 'hero':
      return Platform.select({
        ios: {
          shadowColor,
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 4 },
        },
        android: { elevation: 6 },
        default: {},
      }) as ViewStyle;
    case 'elevated':
      return Platform.select({
        ios: {
          shadowColor,
          shadowOpacity: isDark ? 0.25 : 0.05,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 3 },
        },
        android: { elevation: 5 },
        default: {},
      }) as ViewStyle;
    case 'stat':
      return Platform.select({
        ios: {
          shadowColor,
          shadowOpacity: isDark ? 0.2 : 0.04,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 2 },
        },
        android: { elevation: 3 },
        default: {},
      }) as ViewStyle;
    default:
      return Platform.select({
        ios: {
          shadowColor,
          shadowOpacity: isDark ? 0.15 : 0.03,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 1 },
        },
        android: { elevation: 2 },
        default: {},
      }) as ViewStyle;
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
