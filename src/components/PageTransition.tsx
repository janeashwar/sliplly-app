import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Spring config for smooth professional transitions
const SPRING_CONFIG = {
  damping: 28,
  stiffness: 300,
  mass: 0.8,
};

const TIMING_CONFIG = {
  duration: 250,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

interface SlideTransitionProps {
  children: React.ReactNode;
  direction: 'left' | 'right' | 'none';
  isTransitioning: boolean;
}

export function SlideTransition({ children, direction, isTransitioning }: SlideTransitionProps) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isTransitioning) {
      if (direction === 'left') {
        // Slide out to left, slide in from right
        translateX.value = withTiming(-SCREEN_WIDTH * 0.3, TIMING_CONFIG, () => {
          translateX.value = SCREEN_WIDTH * 0.3;
          translateX.value = withSpring(0, SPRING_CONFIG);
        });
      } else if (direction === 'right') {
        // Slide out to right, slide in from left
        translateX.value = withTiming(SCREEN_WIDTH * 0.3, TIMING_CONFIG, () => {
          translateX.value = -SCREEN_WIDTH * 0.3;
          translateX.value = withSpring(0, SPRING_CONFIG);
        });
      }
    }
  }, [isTransitioning, direction]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
