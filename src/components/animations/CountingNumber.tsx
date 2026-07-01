/**
 * CountingNumber — Animated number counter (0 → target value)
 * Counts up with easing for a premium feel.
 * Supports currency formatting and percentage suffixes.
 */
import React, { useEffect } from 'react';
import { Text, TextProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface CountingNumberProps extends TextProps {
  value: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (value: number) => string;
}

export default function CountingNumber({
  value,
  duration = 1200,
  delay = 0,
  prefix = '',
  suffix = '',
  formatter,
  style,
  ...props
}: CountingNumberProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
  }, [value]);

  // We use a custom approach: render the interpolated value via worklet
  const animatedText = useAnimatedStyle(() => {
    'worklet';
    const current = interpolate(
      progress.value,
      [0, 1],
      [0, value],
      Extrapolation.CLAMP
    );
    // We can't return text from animated style, so we use a different approach
    return {};
  });

  // Use Animated.Text with a workaround — we render N frames via requestAnimationFrame
  // Actually, the simplest reliable approach is using a ref + runOnJS
  const [displayValue, setDisplayValue] = React.useState(0);
  const rafRef = React.useRef<number | null>(null);
  const startTimeRef = React.useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(eased * value);
      setDisplayValue(current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    const timer = setTimeout(() => {
      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, delay]);

  const formatted = formatter
    ? formatter(displayValue)
    : `${prefix}${displayValue.toLocaleString('en-IN')}${suffix}`;

  return (
    <Text style={style} {...props}>
      {formatted}
    </Text>
  );
}
