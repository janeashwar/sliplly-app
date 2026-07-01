/**
 * LongPressMenu — Press-and-hold context menu with haptic feedback
 *
 * Wraps children with a long-press gesture.
 * Shows a floating action menu at the press location.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  ZoomIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LongPressGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../../context/ThemeContext';
import { hapticSuccess } from '../../utils/haptics';
import { radius, spacing, typography } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface MenuAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface LongPressMenuProps {
  children: React.ReactNode;
  actions: MenuAction[];
  style?: ViewStyle;
}

export default function LongPressMenu({ children, actions, style }: LongPressMenuProps) {
  const [visible, setVisible] = useState(false);
  const [anchorY, setAnchorY] = useState(0);
  const { colors, isDark, shadows } = useTheme();
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLongPress = useCallback((event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      hapticSuccess();
      // Capture the Y position of the press for menu placement
      setAnchorY(event.nativeEvent.absoluteY);
      setVisible(true);
    }
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  const handleAction = useCallback((action: MenuAction) => {
    setVisible(false);
    // Small delay so modal closes first
    setTimeout(action.onPress, 150);
  }, []);

  return (
    <>
      <LongPressGestureHandler
        onHandlerStateChange={handleLongPress}
        minDurationMs={500}
      >
        <Animated.View style={style}>{children}</Animated.View>
      </LongPressGestureHandler>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={StyleSheet.absoluteFill}
          >
            {/* Backdrop blur effect */}
            <View style={[styles.backdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]} />
          </Animated.View>

          <Animated.View
            entering={SlideInDown.duration(250).springify().damping(18)}
            exiting={FadeOut.duration(150)}
            style={[
              styles.menuCard,
              {
                backgroundColor: colors.bg.elevated,
                borderColor: colors.border.subtle,
                ...(!isDark ? shadows.high : {}),
              },
            ]}
          >
            {actions.map((action, index) => (
              <Pressable
                key={action.label}
                style={[
                  styles.menuItem,
                  index < actions.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border.subtle,
                  },
                ]}
                onPress={() => handleAction(action)}
              >
                <Ionicons
                  name={action.icon}
                  size={20}
                  color={action.destructive ? colors.semantic.error : colors.text.primary}
                />
                <Text
                  style={[
                    styles.menuLabel,
                    {
                      color: action.destructive ? colors.semantic.error : colors.text.primary,
                    },
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 60,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  menuLabel: {
    ...typography.body,
    fontWeight: '500',
  },
});
