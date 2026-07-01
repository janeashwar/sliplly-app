/**
 * Toast — Animated notification component for Sliplly
 * Slides in from top with spring animation, auto-dismisses.
 * Uses Reanimated for 60fps performance.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  setToastListener,
  clearToastListener,
  type ToastData,
  type ToastType,
} from '../utils/toast';
import { hapticSuccess, hapticError, hapticWarning, hapticTap } from '../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_MARGIN = 16;
const TOAST_MAX_WIDTH = SCREEN_WIDTH - TOAST_MARGIN * 2;

const SPRING_CONFIG = { stiffness: 300, damping: 22, mass: 0.8 };

// ── Type Config ─────────────────────────────────────────
const TYPE_CONFIG: Record<ToastType, { icon: string; color: string; bg: string }> = {
  success: {
    icon: 'checkmark-circle',
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.12)',
  },
  error: {
    icon: 'close-circle',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
  },
  warning: {
    icon: 'warning',
    color: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.12)',
  },
  info: {
    icon: 'information-circle',
    color: '#60A5FA',
    bg: 'rgba(96, 165, 250, 0.12)',
  },
};

// ── Single Toast Item ───────────────────────────────────
function ToastItem({
  toast: t,
  onDismiss,
  isDark,
}: {
  toast: ToastData;
  onDismiss: (id: string) => void;
  isDark: boolean;
}) {
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const config = TYPE_CONFIG[t.type || 'info'];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Slide in
    translateY.value = withSpring(0, SPRING_CONFIG);
    opacity.value = withTiming(1, { duration: 200 });

    // Trigger haptic based on type
    if (t.type === 'success') hapticSuccess();
    else if (t.type === 'error') hapticError();
    else if (t.type === 'warning') hapticWarning();
    else hapticTap();

    // Auto dismiss
    timerRef.current = setTimeout(() => {
      dismiss();
    }, t.duration || 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    translateY.value = withSpring(-120, { ...SPRING_CONFIG, stiffness: 400 });
    opacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(onDismiss)(t.id);
    });
  }, [t.id]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        animStyle,
        {
          backgroundColor: isDark ? '#1C1C1C' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: config.color }]} />

      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon as any} size={20} color={config.color} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {t.title ? (
          <Text style={[styles.title, { color: isDark ? '#F5F5F5' : '#1A1A1A' }]} numberOfLines={1}>
            {t.title}
          </Text>
        ) : null}
        <Text
          style={[styles.message, { color: isDark ? '#A0A0A0' : '#525252' }]}
          numberOfLines={2}
        >
          {t.message}
        </Text>
      </View>

      {/* Dismiss */}
      <Pressable onPress={dismiss} hitSlop={8} style={styles.dismissBtn}>
        <Ionicons name="close-outline" size={16} color={isDark ? '#666' : '#A3A3A3'} />
      </Pressable>
    </Animated.View>
  );
}

// ── Toast Container (mounts in _layout.tsx) ─────────────
export default function ToastProvider({ isDark }: { isDark: boolean }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setToastListener((toast) => {
      setToasts((prev) => [...prev.slice(-2), toast]); // max 3 toasts
    });
    return () => clearToastListener();
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.wrapper, { top: insets.top + 8 }]} pointerEvents="box-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={handleDismiss} isDark={isDark} />
      ))}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    gap: 8,
    pointerEvents: 'box-none',
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: TOAST_MAX_WIDTH,
    borderRadius: 14,
    borderWidth: 1,
    paddingLeft: 4,
    paddingRight: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  message: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 18,
    marginTop: 1,
  },
  dismissBtn: {
    padding: 4,
    marginLeft: 8,
  },
});
