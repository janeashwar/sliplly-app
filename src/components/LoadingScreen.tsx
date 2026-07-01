import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import AnimatedLogo from './AnimatedLogo';
import AnimatedText from './AnimatedText';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function XPattern() {
  const patternSize = 20;
  const cols = Math.ceil(SCREEN_WIDTH / patternSize);
  const rows = Math.ceil(SCREEN_HEIGHT / patternSize);
  const patterns = [];

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      patterns.push(
        <View
          key={`${i}-${j}`}
          style={[styles.xMark, { left: i * patternSize, top: j * patternSize }]}
        >
          <Svg width={8} height={8} viewBox="0 0 8 8">
            <Path
              d="M 1 1 L 7 7 M 7 1 L 1 7"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth={0.8}
              strokeLinecap="round"
            />
          </Svg>
        </View>
      );
    }
  }

  return <View style={styles.patternContainer} pointerEvents="none">{patterns}</View>;
}

export default function LoadingScreen({ onComplete }: { onComplete?: () => void }) {
  const fadeProgress = useSharedValue(0);

  useEffect(() => {
    fadeProgress.value = withTiming(1, {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeProgress.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />
      <View style={styles.background} />
      <XPattern />
      <Animated.View style={[styles.content, containerStyle]}>
        <SafeAreaView style={styles.safe}>
          <AnimatedLogo onComplete={onComplete} />
          <AnimatedText delay={500} />
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0a',
  },
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  xMark: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safe: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
