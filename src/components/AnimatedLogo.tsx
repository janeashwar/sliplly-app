import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Main "Sliplly" path
const SLIPLLY_PATH = "M 2.684 -4.05 C 2.068 -5.294 0.346 -5.134 0.166 -3.912 C 0.013 -2.106 2.734 -3.184 2.755 -1.018 C 2.713 -0.076 0.945 0.678 0.076 -0.84 C -0.212 -1.67 0.54 -1.914 1.111 -1.511 C 1.54 -1.203 2.248 -0.322 2.368 -0.224 C 2.642 -0.003 3.046 -0.007 3.329 -0.344 C 4.419 -1.351 5.593 -5.657 4.55 -4.918 C 3.958 -4.482 3.168 -1.45 4.055 -0.175 C 4.786 0.748 5.692 -2.308 5.292 -1.112 C 4.995 -0.055 5.15 0.198 5.466 -0.105 C 5.621 -0.305 5.904 -0.762 6.128 -1.416 L 6.098 1.98 C 5.929 3.18 5.497 -1.507 6.129 -1.411 C 6.402 -1.42 7.066 -1.42 7.066 -0.692 C 7.048 0.072 6.375 -0.028 6.12 -0.019 C 7.017 0.131 7.293 0.036 7.512 -0.26 C 8.463 -1.269 9.897 -5.778 8.774 -4.878 C 8.352 -4.552 7.227 -1.45 8.092 -0.23 C 8.297 0.027 8.719 0.131 9.01 -0.284 C 9.999 -1.369 11.223 -5.757 10.115 -4.874 C 9.742 -4.543 8.775 -1.541 9.543 -0.305 C 9.956 0.275 10.492 0.075 10.778 -1.355 C 10.576 -0.841 10.563 -0.015 11.228 0.023 C 11.686 -0.015 11.828 -0.727 11.855 -1.341 C 11.737 0.368 11.883 2.249 11.018 1.993 C 10.54 1.817 10.517 1.291 10.982 0.861 C 11.438 0.436 11.986 -0.097 12.879 -0.874";

// Dot of "i"
const I_DOT_PATH = "M 5.54 -1.85 C 5.558 -1.85 5.558 -1.877 5.54 -1.877 C 5.522 -1.877 5.522 -1.85 5.54 -1.85";

const MAIN_PATH_LENGTH = 82;
const DOT_PATH_LENGTH = 5;

export default function AnimatedLogo({ onComplete }: { onComplete?: () => void }) {
  const mainProgress = useSharedValue(0);
  const dotProgress = useSharedValue(0);
  const fadeProgress = useSharedValue(0);

  useEffect(() => {
    fadeProgress.value = withTiming(1, { duration: 300 });

    mainProgress.value = withTiming(1, {
      duration: 4000,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
    });

    dotProgress.value = withDelay(350, withTiming(1, {
      duration: 300,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
    }));

    setTimeout(() => onComplete?.(), 4500);

    // Safety timeout — ensure onComplete is called even if animation fails
    const safetyTimeout = setTimeout(() => {
      onComplete?.();
    }, 5000);

    return () => clearTimeout(safetyTimeout);
  }, []);

  const mainPathProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(
      mainProgress.value,
      [0, 1],
      [MAIN_PATH_LENGTH, 0],
      Extrapolation.CLAMP
    ),
  }));

  const dotPathProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(
      dotProgress.value,
      [0, 1],
      [DOT_PATH_LENGTH, 0],
      Extrapolation.CLAMP
    ),
    opacity: interpolate(
      dotProgress.value,
      [0, 0.1, 1],
      [0, 1, 1],
      Extrapolation.CLAMP
    ),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeProgress.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, containerStyle]}>
        <Svg
          width={SCREEN_WIDTH * 0.85}
          height={200}
          viewBox="-1 -7 14 10"
          preserveAspectRatio="xMidYMid meet"
        >
          <Defs>
            <LinearGradient id="green" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#22c55e" />
              <Stop offset="100%" stopColor="#22c55e" />
            </LinearGradient>
          </Defs>

          <AnimatedPath
            d={SLIPLLY_PATH}
            stroke="url(#green)"
            strokeWidth={0.35}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={MAIN_PATH_LENGTH}
            animatedProps={mainPathProps}
          />

          <AnimatedPath
            d={I_DOT_PATH}
            stroke="#22c55e"
            strokeWidth={0.5}
            strokeLinecap="round"
            fill="#22c55e"
            strokeDasharray={DOT_PATH_LENGTH}
            animatedProps={dotPathProps}
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
