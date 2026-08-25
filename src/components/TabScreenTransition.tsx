/**
 * TabScreenTransition — Wraps each tab screen to animate entry/exit
 *
 * Each tab screen wraps its content with this component. On mount,
 * the content slides in from the appropriate direction with a fade.
 *
 * Direction is determined by comparing the current tab index to the
 * previous tab: going right → settle from right, going left → from left.
 *
 * Nudge-settle: content is fully opaque and on-screen from the first
 * frame (no flash), sliding a small distance into place. ~240ms.
 */
import React, { useEffect, useRef } from 'react';
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

// Global ref to track previous tab index across all instances
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
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isActive && !hasAnimated.current) {
      // Determine direction
      const direction = tabIndex > globalPrevTabIndex ? 1 : -1;
      const isSameTab = tabIndex === globalPrevTabIndex;

      if (!isSameTab) {
        // Start just off-direction, fully opaque — content on screen at frame 0
        translateX.value = direction * SLIDE_DISTANCE;

        // Settle into place — smooth ease
        translateX.value = withTiming(0, {
          duration: SLIDE_DURATION,
          easing: Easing.out(Easing.cubic),
        });
      } else {
        // First mount, no motion needed
        translateX.value = 0;
      }

      hasAnimated.current = true;
      globalPrevTabIndex = tabIndex;
    }
  }, [isActive, tabIndex]);

  // Reset when becoming inactive
  useEffect(() => {
    if (!isActive) {
      hasAnimated.current = false;
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!isActive) return null;

  return (
    /* Opaque outer shell — always the page background color, so the
       first frames of the slide never reveal a white flash behind */
    <View style={[styles.container, { backgroundColor: colors.bg.base }]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
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
