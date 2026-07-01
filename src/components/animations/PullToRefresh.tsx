/**
 * PullToRefresh — Custom animated pull-to-refresh indicator
 * Uses Reanimated for smooth spring physics and rotation animation.
 * Replaces the default RefreshControl with a branded experience.
 */
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, RefreshControl as RNRefreshControl } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSpring,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface PullToRefreshProps {
  refreshing: boolean;
  onRefresh: () => void;
  tintColor?: string;
}

export default function PullToRefresh({
  refreshing,
  onRefresh,
  tintColor = '#d6ed6a',
}: PullToRefreshProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0);

  React.useEffect(() => {
    if (refreshing) {
      // Spin continuously while refreshing
      rotation.value = withRepeat(
        withTiming(360, { duration: 800, easing: Easing.linear }),
        -1,
        false
      );
      scale.value = withSpring(1, { stiffness: 300, damping: 20 });
    } else {
      rotation.value = withTiming(0, { duration: 200 });
      scale.value = withSpring(0, { stiffness: 300, damping: 20 });
    }
  }, [refreshing]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <RNRefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="transparent"
      colors={['transparent']}
      style={{ backgroundColor: 'transparent' }}
      progressViewOffset={-9999}
    />
  );
}

// ── Custom refresh indicator overlay (renders on top) ──
interface RefreshIndicatorProps {
  refreshing: boolean;
  tintColor?: string;
}

export function RefreshIndicator({ refreshing, tintColor = '#d6ed6a' }: RefreshIndicatorProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (refreshing) {
      opacity.value = withTiming(1, { duration: 200 });
      rotation.value = withRepeat(
        withTiming(360, { duration: 800, easing: Easing.linear }),
        -1,
        false
      );
      scale.value = withSpring(1, { stiffness: 300, damping: 18 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      rotation.value = withTiming(0, { duration: 200 });
      scale.value = withSpring(0, { stiffness: 300, damping: 18 });
    }
  }, [refreshing]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  if (!refreshing) return null;

  return (
    <View style={indicatorStyles.container} pointerEvents="none">
      <Animated.View style={[indicatorStyles.indicator, animStyle]}>
        <View style={indicatorStyles.ring}>
          <Ionicons name="sync" size={20} color={tintColor} />
        </View>
      </Animated.View>
    </View>
  );
}

const indicatorStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 100,
  },
  indicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
