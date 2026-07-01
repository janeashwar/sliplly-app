/**
 * TabScreenTransition — Wraps each tab screen to animate entry/exit
 *
 * Each tab screen wraps its content with this component. On mount,
 * the content slides in from the appropriate direction with a fade.
 *
 * Direction is determined by comparing the current tab index to the
 * previous tab: going right → slide from right, going left → slide from left.
 *
 * Uses spring animation for natural feel. ~350ms total.
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
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

// Spring config for natural slide
const SPRING = {
  stiffness: 300,
  damping: 30,
  mass: 0.9,
  overshootClamping: false,
};

const SLIDE_DISTANCE = 80; // Subtle slide, not full screen width
const FADE_DURATION = 200;

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
  const opacity = useSharedValue(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isActive && !hasAnimated.current) {
      // Determine direction
      const direction = tabIndex > globalPrevTabIndex ? 1 : -1;
      const isSameTab = tabIndex === globalPrevTabIndex;

      if (!isSameTab) {
        // Start offscreen
        translateX.value = direction * SLIDE_DISTANCE;
        opacity.value = 0;

        // Animate in
        translateX.value = withSpring(0, SPRING);
        opacity.value = withTiming(1, {
          duration: FADE_DURATION,
          easing: Easing.out(Easing.cubic),
        });
      } else {
        // First mount, just fade in
        opacity.value = withTiming(1, {
          duration: FADE_DURATION,
          easing: Easing.out(Easing.cubic),
        });
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
    opacity: opacity.value,
  }));

  if (!isActive) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle, { backgroundColor: colors.bg.base }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
