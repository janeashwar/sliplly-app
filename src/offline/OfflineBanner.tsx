/**
 * OfflineBanner — Animated banner shown when device is offline
 *
 * Slides in from top, shows connectivity status and pending operations count.
 * Uses Reanimated for smooth 60fps animation.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { networkMonitor, NetworkStatus } from './networkMonitor';
import { offlineQueue } from './offlineQueue';
import { typography, spacing, radius } from '../theme/colors';

const SPRING = { stiffness: 300, damping: 25, mass: 0.8 };

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);
  const syncRotation = useSharedValue(0);

  // Subscribe to network changes
  useEffect(() => {
    const unsub = networkMonitor.subscribe((status: NetworkStatus) => {
      const online = status.isConnected && status.isInternetReachable !== false;
      setIsOnline(online);
    });
    return unsub;
  }, []);

  // Subscribe to queue changes
  useEffect(() => {
    const unsub = offlineQueue.subscribe((count) => {
      setPendingCount(count);
      setIsSyncing(offlineQueue.isSyncing);
    });
    return unsub;
  }, []);

  // Animate banner visibility
  useEffect(() => {
    if (!isOnline) {
      translateY.value = withSpring(0, SPRING);
      opacity.value = withTiming(1, { duration: 200 });
    } else if (pendingCount > 0) {
      // Show briefly when syncing after reconnect
      translateY.value = withSpring(0, SPRING);
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(-80, SPRING);
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOnline, pendingCount]);

  // Syncing spinner rotation
  useEffect(() => {
    if (isSyncing) {
      syncRotation.value = withTiming(360, { duration: 1000 }, () => {
        syncRotation.value = 0;
      });
    }
  }, [isSyncing]);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const syncIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${syncRotation.value}deg` }],
  }));

  const bannerColor = !isOnline
    ? '#EF4444' // red when offline
    : pendingCount > 0
    ? '#FBBF24' // yellow when syncing
    : '#34D399'; // green (shouldn't show)

  const bannerText = !isOnline
    ? 'You\'re offline'
    : pendingCount > 0
    ? `Syncing ${pendingCount} operation${pendingCount > 1 ? 's' : ''}...`
    : '';

  const bannerIcon = !isOnline
    ? 'cloud-offline'
    : pendingCount > 0
    ? 'sync'
    : 'checkmark-circle';

  if (isOnline && pendingCount === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        bannerStyle,
        {
          top: insets.top,
          backgroundColor: bannerColor + '15',
          borderColor: bannerColor + '30',
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: bannerColor }]} />

      {isSyncing ? (
        <Animated.View style={syncIconStyle}>
          <Ionicons name="sync" size={14} color={bannerColor} />
        </Animated.View>
      ) : (
        <Ionicons name={bannerIcon as any} size={14} color={bannerColor} />
      )}

      <Text style={[styles.text, { color: bannerColor }]}>{bannerText}</Text>

      {!isOnline && pendingCount > 0 && (
        <View style={[styles.badge, { backgroundColor: bannerColor }]}>
          <Text style={styles.badgeText}>{pendingCount}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9998,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
