/**
 * TabScreenTransition — Wraps each tab screen to animate entry/exit
 *
 * Each tab screen wraps its content with this component. On mount,
 * the content slides in from the appropriate direction with a fade.
 *
 * Direction is determined by comparing the current tab index to the
 * previous tab: going right → slide from right, going left → slide from left.
 *
 * Full-width slide with smooth ease — matches the stack pages'
 * slide_from_right animation. ~220ms total.
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

// Full-width slide — matches the stack pages' slide_from_right feel
const SLIDE_DISTANCE = SCREEN_WIDTH;
const SLIDE_DURATION = 220; // ms — close to the stack's 200ms
const FADE_DURATION = 180;

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

        // Animate in — smooth ease like the stack's slide_from_right
        translateX.value = withTiming(0, {
          duration: SLIDE_DURATION,
          easing: Easing.out(Easing.cubic),
        });
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
