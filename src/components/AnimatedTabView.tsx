/**
 * AnimatedTabView — Premium slide transitions between tab pages
 *
 * When switching tabs, the new page slides in from the direction of the tab:
 *   Left tab → right tab = slide left (new content enters from right)
 *   Right tab → left tab = slide right (new content enters from left)
 *
 * Uses spring animation for natural feel + subtle fade during transition.
 * 300-400ms duration, 60fps via Reanimated worklets.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Spring config for natural slide feel
const SPRING_SLIDE = {
  stiffness: 280,
  damping: 28,
  mass: 0.9,
  overshootClamping: false,
};

// Fade timing
const FADE_DURATION = 180;

interface AnimatedTabViewProps {
  activeIndex: number;
  prevIndex: number;
  isAnimating: boolean;
  direction: 'left' | 'right' | 'none';
  children: React.ReactNode[];
  onAnimationEnd: () => void;
}

export function AnimatedTabView({
  activeIndex,
  prevIndex,
  isAnimating,
  direction,
  children,
  onAnimationEnd,
}: AnimatedTabViewProps) {
  const { colors } = useTheme();

  // Shared values for the outgoing (old) screen
  const outgoingTranslateX = useSharedValue(0);
  const outgoingOpacity = useSharedValue(1);

  // Shared values for the incoming (new) screen
  const incomingTranslateX = useSharedValue(0);
  const incomingOpacity = useSharedValue(0);

  // Track which screen is "visible" — during transition we show both overlapped
  const [displayIndex, setDisplayIndex] = React.useState(activeIndex);
  const [showBoth, setShowBoth] = React.useState(false);
  const prevActiveRef = useRef(activeIndex);

  // Trigger animation when tab changes
  useEffect(() => {
    if (activeIndex === prevActiveRef.current) return;

    const oldIndex = prevActiveRef.current;
    const newIndex = activeIndex;
    const dir = newIndex > oldIndex ? 'left' : 'right';
    const slideDistance = SCREEN_WIDTH;

    // Set up: incoming starts offscreen, outgoing starts in place
    if (dir === 'left') {
      // New tab is to the right → slide in from right
      incomingTranslateX.value = slideDistance;
      outgoingTranslateX.value = 0;
    } else {
      // New tab is to the left → slide in from left
      incomingTranslateX.value = -slideDistance;
      outgoingTranslateX.value = 0;
    }
    incomingOpacity.value = 0;
    outgoingOpacity.value = 1;

    // Show both screens overlapped for crossfade
    setDisplayIndex(newIndex);
    setShowBoth(true);

    // Animate incoming in
    incomingTranslateX.value = withSpring(0, SPRING_SLIDE, () => {
      'worklet';
    });
    incomingOpacity.value = withTiming(1, { duration: FADE_DURATION, easing: Easing.out(Easing.cubic) });

    // Animate outgoing out
    if (dir === 'left') {
      outgoingTranslateX.value = withSpring(-slideDistance * 0.25, {
        ...SPRING_SLIDE,
        stiffness: 200,
        damping: 30,
      });
    } else {
      outgoingTranslateX.value = withSpring(slideDistance * 0.25, {
        ...SPRING_SLIDE,
        stiffness: 200,
        damping: 30,
      });
    }
    outgoingOpacity.value = withTiming(0, { duration: FADE_DURATION, easing: Easing.out(Easing.cubic) });

    // After animation, clean up
    const timeout = setTimeout(() => {
      setShowBoth(false);
      outgoingTranslateX.value = 0;
      outgoingOpacity.value = 1;
      incomingTranslateX.value = 0;
      incomingOpacity.value = 1;
      prevActiveRef.current = newIndex;
      onAnimationEnd();
    }, 450); // Slightly longer than spring settles

    return () => clearTimeout(timeout);
  }, [activeIndex]);

  // Update display index when not animating (for non-animated initial mount)
  useEffect(() => {
    if (!showBoth) {
      setDisplayIndex(activeIndex);
      prevActiveRef.current = activeIndex;
    }
  }, [activeIndex, showBoth]);

  const incomingStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: incomingTranslateX.value }],
    opacity: incomingOpacity.value,
  }));

  const outgoingStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: outgoingTranslateX.value }],
    opacity: outgoingOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.base }]}>
      {React.Children.map(children, (child, index) => {
        if (showBoth) {
          // During transition: show both old and new with animation
          if (index === displayIndex) {
            // Incoming (new) screen
            return (
              <Animated.View
                key={index}
                style={[styles.screen, incomingStyle, { backgroundColor: colors.bg.base }]}
                pointerEvents={index === displayIndex ? 'auto' : 'none'}
              >
                {child}
              </Animated.View>
            );
          } else if (index === prevActiveRef.current) {
            // Outgoing (old) screen
            return (
              <Animated.View
                key={index}
                style={[styles.screen, outgoingStyle, { backgroundColor: colors.bg.base }]}
                pointerEvents="none"
              >
                {child}
              </Animated.View>
            );
          }
          return null;
        }

        // Not animating: only show active tab
        return index === displayIndex ? (
          <View
            key={index}
            style={[styles.screen, { backgroundColor: colors.bg.base }]}
          >
            {child}
          </View>
        ) : null;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    ...StyleSheet.absoluteFillObject,
  },
});
