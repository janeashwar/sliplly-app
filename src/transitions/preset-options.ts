// All 5 transition presets for Sliplly
// Source: Code with Nomi video + react-native-screen-transitions docs
//
// 1. Vertical Slide — search screen slides from top
// 2. Contained Zoom — job details zoom in with border radius
// 3. Vertical Dismiss Zoom — zoom + swipe down to dismiss
// 4. Sheet with Snap Points — watchlist/share sheets
// 5. Drawer — filter/settings slides from right

import { Extrapolation, interpolate } from 'react-native-reanimated';
import type { SpringConfig } from './types';

// ============================================
// SPRING PHYSICS — the feel of the animation
// ============================================
const OPEN_SPRING: SpringConfig = { stiffness: 680, damping: 68, mass: 0.9 };
const CLOSE_SPRING: SpringConfig = { stiffness: 680, damping: 68, mass: 0.9 };
const SNAP_OPEN_SPRING: SpringConfig = { stiffness: 680, damping: 68, mass: 0.9 };
const SNAP_CLOSE_SPRING: SpringConfig = { stiffness: 680, damping: 68, mass: 0.9 };

const defaultTransitionSpec = { open: OPEN_SPRING, close: CLOSE_SPRING };

// ============================================
// 1. VERTICAL SLIDE TRANSITION
// Use case: Search screen slides from top
// ============================================
export function createVerticalSlideTransition(from: 'top' | 'bottom') {
  return {
    gestureEnabled: true,
    gestureDirection: from === 'top' ? 'vertical-inverted' : 'vertical',
    transitionSpec: defaultTransitionSpec,
    screenStyleInterpolator: ({ progress, layout }: any) => {
      'worklet';
      const height = layout.screen.height;
      const closedY = from === 'top' ? -height : height;
      return {
        content: {
          style: {
            transform: [
              {
                translateY: interpolate(
                  progress,
                  [0, 1, 2],
                  [closedY, 0, 0],
                  Extrapolation.CLAMP
                ),
              },
            ],
          },
        },
      };
    },
  };
}

// ============================================
// 2. CONTAINED ZOOM TRANSITION
// Use case: Job details, gallery — screen zooms in
// Scale 0.7→1, opacity 0.7→1, border radius 36→0
// Background scales down to 0.93
// ============================================
export function containedZoomTransition() {
  return {
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
    transitionSpec: defaultTransitionSpec,
    screenStyleInterpolator: ({ progress, active, focused, layout }: any) => {
      'worklet';

      // When this screen is BEHIND another screen — scale down background
      if (!focused) {
        return {
          content: {
            style: {
              transform: [
                {
                  scale: interpolate(
                    active.progress,
                    [1.5, 2],
                    [1, 0.93],
                    Extrapolation.CLAMP
                  ),
                },
              ],
            },
          },
        };
      }

      // When this screen is COMING INTO VIEW — zoom in
      return {
        content: {
          style: {
            opacity: interpolate(progress, [0, 1], [0.7, 1], Extrapolation.CLAMP),
            borderRadius: interpolate(progress, [0, 1], [36, 0], Extrapolation.CLAMP),
            transform: [
              {
                scale: interpolate(progress, [0, 1], [0.7, 1], Extrapolation.CLAMP),
              },
              {
                translateY: interpolate(progress, [0, 1], [50, 0], Extrapolation.CLAMP),
              },
            ],
          },
        },
      };
    },
  };
}

// ============================================
// 3. VERTICAL DISMISS ZOOM
// Use case: Modal screens — zoom in, swipe down to dismiss
// Combines contained zoom + vertical gesture
// ============================================
export function verticalDismissZoomTransition() {
  return {
    ...containedZoomTransition(),
    gestureDirection: 'vertical' as const,
    gestureActivationArea: 'screen' as const,
  };
}

// ============================================
// 4. SHEET TRANSITION WITH SNAP POINTS
// Use case: Action sheets, share sheets, watchlist
// Slides up from bottom, snaps to positions
// Background scales down to 0.93
// ============================================
export function createSheetTransition(
  snapPoints: number[],
  backdropBehavior: 'dismiss' | 'collapse' = 'collapse'
) {
  return {
    gestureEnabled: true,
    gestureDirection: 'vertical' as const,
    sheetScrollGestureBehavior: 'expand-and-collapse' as const,
    snapPoints,
    backdropBehavior,
    transitionSpec: {
      ...defaultTransitionSpec,
      expand: SNAP_OPEN_SPRING,
      collapse: SNAP_CLOSE_SPRING,
    },
    screenStyleInterpolator: ({ progress, active, focused, layout }: any) => {
      'worklet';

      // Background screen scales down when sheet opens
      if (!focused) {
        return {
          content: {
            style: {
              transform: [
                {
                  scale: interpolate(
                    active.progress,
                    [1.5, 2],
                    [1, 0.93],
                    Extrapolation.CLAMP
                  ),
                },
              ],
            },
          },
        };
      }

      // Sheet slides up from bottom
      return {
        content: {
          style: {
            backgroundColor: '#141414',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: 'hidden' as const,
            transform: [
              {
                translateY: interpolate(
                  progress,
                  [0, 1, 2],
                  [layout.screen.height, 0, 0],
                  Extrapolation.CLAMP
                ),
              },
            ],
          },
        },
        backdrop: {
          style: {
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: interpolate(progress, [0, 1], [0, 1], Extrapolation.CLAMP),
          },
        },
      };
    },
  };
}

// Pre-configured sheet presets
export const watchlistSheetTransition = () => createSheetTransition([0.74, 1.0], 'collapse');
export const shareSheetTransition = () => createSheetTransition([0.72, 1.0], 'dismiss');

// ============================================
// 5. DRAWER TRANSITION
// Use case: Filter/settings — slides from right
// Background scales down to 0.96
// ============================================
export function filterDrawerTransition() {
  return {
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
    backdropBehavior: 'dismiss' as const,
    transitionSpec: defaultTransitionSpec,
    screenStyleInterpolator: ({ progress, active, focused, layout }: any) => {
      'worklet';

      // Background screen scales down
      if (!focused) {
        return {
          content: {
            style: {
              transform: [
                {
                  scale: interpolate(
                    active.progress,
                    [1, 2],
                    [1, 0.96],
                    Extrapolation.CLAMP
                  ),
                },
              ],
            },
          },
        };
      }

      // Drawer slides from right
      return {
        content: {
          style: {
            transform: [
              {
                translateX: interpolate(
                  progress,
                  [0, 1],
                  [layout.screen.width, 0],
                  Extrapolation.CLAMP
                ),
              },
            ],
          },
        },
        backdrop: {
          style: {
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: interpolate(progress, [0, 1], [0, 1], Extrapolation.CLAMP),
          },
        },
      };
    },
  };
}

// ============================================
// 6. BOTTOM SHEET LIKE TRANSITION
// Use case: Cast member, quick details — slides up like a sheet
// ============================================
export function bottomSheetLikeTransition() {
  return {
    ...createSheetTransition([0.5, 1.0], 'dismiss'),
    gestureActivationArea: 'screen' as const,
  };
}
