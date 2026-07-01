import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

interface ScreenHeaderProps {
  title: string;
  scrollProgress?: SharedValue<number>;
  rightAction?: React.ReactNode;
}

export default function ScreenHeader({ title, scrollProgress, rightAction }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  // Title shrinks on scroll
  const titleStyle = useAnimatedStyle(() => {
    if (!scrollProgress) return {};
    return {
      transform: [
        { scale: interpolate(scrollProgress.value, [0, 30, 80, 120], [1, 1, 0.75, 0.75], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.row}>
        <Animated.Text style={[styles.title, titleStyle]}>
          {title}
        </Animated.Text>
        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </Animated.View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 90,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.base,
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.8,
    fontSize: 28,
    transformOrigin: 'top left',
  },
  rightAction: {
    marginLeft: 'auto',
  },
});
