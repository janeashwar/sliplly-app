import React, { useCallback } from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { hapticMedium } from '../../utils/haptics';

const PRESS_SPRING = { stiffness: 400, damping: 20, mass: 0.8 };

interface PressableCardProps extends PressableProps {
  children: React.ReactNode;
}

export default function PressableCard({ children, style, onPress, ...props }: PressableCardProps) {
  const pressScale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    hapticMedium();
    pressScale.value = withSpring(0.95, PRESS_SPRING);
  }, []);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, PRESS_SPRING);
  }, []);

  const handlePress = useCallback((e: any) => {
    if (onPress) onPress(e);
  }, [onPress]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        style={style}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
