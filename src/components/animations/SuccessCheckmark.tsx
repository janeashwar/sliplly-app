/**
 * SuccessCheckmark — Lottie-style checkmark animation using pure Reanimated
 * Draws an animated circle + checkmark path with spring physics.
 * Perfect for booking confirmations, form submissions, etc.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 40;
const CHECK_PATH_LENGTH = 60;

interface SuccessCheckmarkProps {
  size?: number;
  onComplete?: () => void;
  autoPlay?: boolean;
}

export default function SuccessCheckmark({
  size = 120,
  onComplete,
  autoPlay = true,
}: SuccessCheckmarkProps) {
  const circleProgress = useSharedValue(0);
  const checkProgress = useSharedValue(0);
  const scaleProgress = useSharedValue(0);
  const glowProgress = useSharedValue(0);

  useEffect(() => {
    if (!autoPlay) return;

    // Scale in with bounce
    scaleProgress.value = withSpring(1, {
      stiffness: 200,
      damping: 12,
      mass: 0.8,
    });

    // Circle draws in
    circleProgress.value = withDelay(
      100,
      withTiming(1, {
        duration: 600,
        easing: Easing.bezier(0.65, 0, 0.35, 1),
      })
    );

    // Checkmark draws in after circle
    checkProgress.value = withDelay(
      500,
      withTiming(1, {
        duration: 400,
        easing: Easing.bezier(0.65, 0, 0.35, 1),
      })
    );

    // Glow pulse
    glowProgress.value = withDelay(
      700,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.quad),
      })
    );

    // Callback when done
    const timer = setTimeout(() => onComplete?.(), 1200);
    return () => clearTimeout(timer);
  }, [autoPlay]);

  const circleProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(
      circleProgress.value,
      [0, 1],
      [CIRCLE_CIRCUMFERENCE, 0],
      Extrapolation.CLAMP
    ),
  }));

  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(
      checkProgress.value,
      [0, 1],
      [CHECK_PATH_LENGTH, 0],
      Extrapolation.CLAMP
    ),
    opacity: interpolate(
      checkProgress.value,
      [0, 0.1, 1],
      [0, 1, 1],
      Extrapolation.CLAMP
    ),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleProgress.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowProgress.value * 0.3,
    transform: [{ scale: interpolate(glowProgress.value, [0, 1], [0.8, 1.3]) }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: (size * 1.5) / 2,
          },
          glowStyle,
        ]}
      />

      <Animated.View style={[styles.svgWrap, containerStyle]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#34D399" />
              <Stop offset="100%" stopColor="#10B981" />
            </LinearGradient>
          </Defs>

          {/* Background circle */}
          <Circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(52, 211, 153, 0.15)"
            strokeWidth="4"
          />

          {/* Animated circle */}
          <AnimatedCircle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#successGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCLE_CIRCUMFERENCE}
            animatedProps={circleProps}
            transform="rotate(-90, 50, 50)"
          />

          {/* Checkmark */}
          <AnimatedPath
            d="M 30 52 L 44 66 L 70 38"
            fill="none"
            stroke="#34D399"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={CHECK_PATH_LENGTH}
            animatedProps={checkProps}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  svgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
