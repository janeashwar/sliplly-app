/**
 * SwipeableRow — Swipe-to-reveal actions (delete, edit, etc.)
 *
 * Uses react-native-gesture-handler + reanimated for smooth 60fps swipe.
 * Configurable left/right actions with haptic feedback.
 */

import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Text, Animated as RNAnimated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { hapticWarning } from '../../utils/haptics';
import { radius, spacing, typography } from '../../theme/colors';

interface SwipeAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  threshold?: number;
}

export default function SwipeableRow({
  children,
  leftAction,
  rightAction,
  threshold = 80,
}: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const { colors, isDark } = useTheme();

  const close = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  const renderAction = (
    action: SwipeAction,
    progress: RNAnimated.AnimatedInterpolation<number>,
    direction: 'left' | 'right'
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [direction === 'left' ? -threshold : threshold, 0],
    });

    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
    });

    const scale = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.5, 0.8, 1],
    });

    return (
      <RNAnimated.View
        style={[
          styles.actionContainer,
          { transform: [{ translateX }], opacity },
        ]}
      >
        <RNAnimated.View
          style={[
            styles.actionButton,
            { backgroundColor: action.backgroundColor, transform: [{ scale }] },
          ]}
        >
          <Ionicons name={action.icon} size={22} color={action.color} />
          <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
        </RNAnimated.View>
      </RNAnimated.View>
    );
  };

  const renderLeftActions = leftAction
    ? (progress: RNAnimated.AnimatedInterpolation<number>) =>
        renderAction(leftAction, progress, 'left')
    : undefined;

  const renderRightActions = rightAction
    ? (progress: RNAnimated.AnimatedInterpolation<number>) =>
        renderAction(rightAction, progress, 'right')
    : undefined;

  const handleSwipeableOpen = (direction: 'left' | 'right') => {
    hapticWarning();
    const action = direction === 'left' ? leftAction : rightAction;
    if (action) {
      action.onPress();
      // Close after a brief delay so the user sees the action triggered
      setTimeout(close, 300);
    }
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeableOpen}
      overshootLeft={false}
      overshootRight={false}
      friction={2}
      leftThreshold={threshold}
      rightThreshold={threshold}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  actionButton: {
    width: 68,
    height: '85%',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionLabel: {
    ...typography.tiny,
    fontWeight: '600',
  },
});
