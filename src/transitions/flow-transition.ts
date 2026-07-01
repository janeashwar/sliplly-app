import { Extrapolation, interpolate } from 'react-native-reanimated';
import type { ScreenTransitionConfig } from 'react-native-screen-transitions';

/**
 * createFlowTransition — direction-aware tab transition
 *
 * Entering screen  (progress 0→1):
 *   - Slides in from the edge (left or right)
 *   - Rounded corners (24px) that flatten to 0 once settled
 *   - No opacity change on the entering screen
 *
 * Background/exiting screen  (progress 1→2):
 *   - Scale shrinks 1 → 0.75
 *   - Dark overlay fades in 0 → 0.25 (25% darkening)
 *
 * Both halves complete at the same time (shared spring spec).
 */
export const createFlowTransition = (
  direction: 'left' | 'right',
  config: Partial<ScreenTransitionConfig> = {},
): ScreenTransitionConfig => {
  return {
    gestureEnabled: false,
    screenStyleInterpolator: ({
      progress,
      layouts: { screen: { width } },
    }: any) => {
      'worklet';

      // Entering: slide from the outer edge inward to 0
      // Exiting (behind): nudge slightly in the opposite direction (parallax feel)
      const startX = direction === 'right' ? width : -width;
      const exitX  = direction === 'right' ? -width * 0.25 : width * 0.25;

      const translateX = interpolate(
        progress,
        [0, 1, 2],
        [startX, 0, exitX],
        Extrapolation.CLAMP,
      );

      // Corners are rounded while the new screen is flying in, then snap flat
      const borderRadius = interpolate(
        progress,
        [0, 0.6, 1, 2],
        [24, 20, 0, 0],
        Extrapolation.CLAMP,
      );

      // Background screen darkens as the new one arrives
      const overlayOpacity = interpolate(
        progress,
        [0, 1, 2],
        [0, 0, 0.25],
        Extrapolation.CLAMP,
      );

      // Background screen shrinks to 75% while the new one is fully visible
      const scale = interpolate(
        progress,
        [0, 1, 2],
        [1, 1, 0.75],
        Extrapolation.CLAMP,
      );

      return {
        // The screen that is entering/leaving
        content: {
          style: {
            transform: [{ translateX }],
            borderRadius,
            overflow: 'hidden',
          } as any,
        },
        // Dark overlay rendered on top of the background (exiting) screen
        overlay: {
          style: {
            opacity: overlayOpacity,
            backgroundColor: '#000000',
          },
        },
        // The screen being pushed to the background
        background: {
          style: {
            transform: [{ scale }],
          } as any,
        },
      };
    },
    transitionSpec: {
      // Snappy spring — feels responsive but still smooth
      open:  { stiffness: 220, damping: 28, mass: 1 } as any,
      close: { stiffness: 220, damping: 28, mass: 1 } as any,
    },
    ...config,
  };
};

// Convenience named exports for direct use
export const FlowFromRight = (config: Partial<ScreenTransitionConfig> = {}) =>
  createFlowTransition('right', config);

export const FlowFromLeft = (config: Partial<ScreenTransitionConfig> = {}) =>
  createFlowTransition('left', config);
