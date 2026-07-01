import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LETTERS = 'Sliplly'.split('');

function AnimatedLetter({ letter, index, totalDelay }: { letter: string; index: number; totalDelay: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.5);
  const rotate = useSharedValue(-10);

  useEffect(() => {
    const delay = totalDelay + index * 120;

    opacity.value = withDelay(delay, withTiming(1, {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }));

    translateY.value = withDelay(delay, withTiming(0, {
      duration: 600,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    }));

    scale.value = withDelay(delay, withSequence(
      withTiming(1.2, { duration: 200, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }),
      withTiming(1, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    ));

    rotate.value = withDelay(delay, withTiming(0, {
      duration: 500,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const colors = [
    '#818cf8', // S - indigo
    '#a78bfa', // l - violet
    '#c084fc', // i - purple
    '#e879f9', // p - fuchsia
    '#f472b6', // l - pink
    '#fb7185', // l - rose
    '#f97316', // y - orange
  ];

  return (
    <Animated.Text
      style={[styles.letter, animatedStyle, { color: colors[index] || '#a78bfa' }]}
    >
      {letter}
    </Animated.Text>
  );
}

export default function AnimatedText({ delay = 1500 }: { delay?: number }) {
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(15);

  useEffect(() => {
    const subtitleDelay = delay + LETTERS.length * 120 + 300;

    subtitleOpacity.value = withDelay(subtitleDelay, withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }));

    subtitleTranslateY.value = withDelay(subtitleDelay, withTiming(0, {
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }));
  }, []);

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.lettersRow}>
        {LETTERS.map((letter, index) => (
          <AnimatedLetter
            key={index}
            letter={letter}
            index={index}
            totalDelay={delay}
          />
        ))}
      </View>

      <Animated.Text style={[styles.subtitle, subtitleStyle]}>
        Your Journey, Simplified
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 20,
  },
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1,
    textShadowColor: 'rgba(168, 85, 247, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 12,
  },
});
