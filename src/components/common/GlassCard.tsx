/**
 * GlassCard — Premium glassmorphism card with gradient overlay
 *
 * Adds depth and polish with:
 * - Subtle gradient overlay (theme-aware)
 * - Multi-layered warm-tinted shadows for elevation
 * - Optional blur backdrop
 * - No harsh borders — shadows for separation
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'hero' | 'stat' | 'activity' | 'elevated';
  intensity?: number; // blur intensity 0-100
  showBlur?: boolean;
}

function GlassCardInner({
  children,
  style,
  variant = 'default',
  intensity = 20,
  showBlur = false,
}: GlassCardProps) {
  const { isDark, colors } = useTheme();

  const gradientColors = getGradientColors(variant, isDark);

  return (
    <View style={[styles.container, getShadow(variant, isDark), style]}>
      {/* Optional blur backdrop */}
      {showBlur && (
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Gradient overlay — subtle glassmorphism effect */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

export default React.memo(GlassCardInner);

function getGradientColors(variant: string, isDark: boolean): [string, string, ...string[]] {
  if (isDark) {
    // Dark theme: subtle white/transparent wash from top-left
    switch (variant) {
      case 'hero':
        return ['rgba(214,237,106,0.04)', 'rgba(255,255,255,0.01)', 'rgba(0,0,0,0)'];
      case 'stat':
        return ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)', 'rgba(0,0,0,0)'];
      case 'activity':
        return ['rgba(255,255,255,0.02)', 'rgba(0,0,0,0)'];
      case 'elevated':
        return ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0)'];
      default:
        return ['rgba(255,255,255,0.02)', 'rgba(0,0,0,0)'];
    }
  }

  // Light theme: warm premium depth gradients
  switch (variant) {
    case 'hero':
      return ['rgba(254,254,254,1)', 'rgba(248,247,244,0.95)', 'rgba(243,242,239,0.9)'];
    case 'stat':
      return ['rgba(254,254,254,1)', 'rgba(248,247,244,0.97)'];
    case 'activity':
      return ['rgba(254,254,254,1)', 'rgba(248,247,244,0.96)'];
    case 'elevated':
      return ['rgba(255,255,255,1)', 'rgba(250,249,246,0.97)'];
    default:
      return ['rgba(254,254,254,1)', 'rgba(248,247,244,0.98)'];
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
    // No harsh border — shadow provides separation
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
