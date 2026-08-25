/**
 * TabScreenTransition — Wraps each tab screen for page-to-page motion
 *
 * Nudge-settle: on tab change the incoming screen is fully opaque and
 * settles a small distance into place (direction-aware), so there is no
 * blank frame / flash.
 *
 * The shell stays MOUNTED for the whole app session (hidden via display
 * when inactive). This keeps scroll positions, avoids remount jank on
 * low-end phones, and means entrance animations (FadeInDown etc.) play
 * only on first mount — never again on every visit.
 */
import React, { useLayoutEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { usePathname } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

// Tab order for direction calculation
const TAB_ORDER = ['dashboard', 'trips', 'calendar', 'more'];

function getTabIndex(pathname: string): number {
  for (let i = 0; i < TAB_ORDER.length; i++) {
    if (pathname.includes(TAB_ORDER[i])) return i;
  }
  return 0;
}

// Global tracker for direction across all tab instances
let globalPrevTabIndex = 0;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Direction-aware settle: content is visible from the first frame (no
// blank/flash gap). A full offscreen slide always flashes because the
// navigator hides the old tab instantly — so we nudge-settle instead.
const SLIDE_DISTANCE = Math.min(SCREEN_WIDTH * 0.08, 48);
const SLIDE_DURATION = 240;

interface TabScreenTransitionProps {
  tabIndex: number;
  children: React.ReactNode;
}

export default function TabScreenTransition({ tabIndex, children }: TabScreenTransitionProps) {
  const pathname = usePathname();
  const { colors } = useTheme();
  const currentTabIndex = getTabIndex(pathname);
  const isActive = currentTabIndex === tabIndex;

  const translateX = useSharedValue(0);

  // useLayoutEffect — applies the offset BEFORE the frame paints, so the
  // settle never starts a frame late (that late start read as a glitch).
  useLayoutEffect(() => {
    if (!isActive) return;

    if (tabIndex === globalPrevTabIndex) {
      // First screen at app open — no motion
      translateX.value = 0;
    } else {
      const direction = tabIndex > globalPrevTabIndex ? 1 : -1;
      translateX.value = direction * SLIDE_DISTANCE;
      translateX.value = withTiming(0, {
        duration: SLIDE_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    }
    globalPrevTabIndex = tabIndex;
  }, [isActive, tabIndex]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Always mounted — hidden when inactive. Keeps scroll position, prevents
  // remount jank, stops entrance animations replaying on every visit.
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.bg.base, display: isActive ? 'flex' : 'none' },
      ]}
      pointerEvents={isActive ? 'auto' : 'none'}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} collapsable={false}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
