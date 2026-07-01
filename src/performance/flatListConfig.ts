/**
 * FlatList Configuration — Optimized defaults for performant lists
 *
 * Provides pre-tuned FlatList props for different list sizes.
 * Use these spread into FlatList to avoid common performance pitfalls.
 */

import { Dimensions, Platform } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Default Optimized Props ──
export const flatListDefaults = {
  /** Remove clipped subviews (Android perf win) */
  removeClippedSubviews: Platform.OS === 'android',

  /** Render fewer items per batch */
  maxToRenderPerBatch: 8,

  /** Shorter render window */
  updateCellsBatchingPeriod: 50,

  /** Smaller window size = less offscreen rendering */
  windowSize: 7,

  /** Initial items to render */
  initialNumToRender: 10,

  /** Throttle scroll events */
  scrollEventThrottle: 16,

  /** Disable nested scrolling on Android */
  nestedScrollEnabled: false,

  /** Key extractor — standard */
  keyExtractor: (item: any, index: number) =>
    item?.id?.toString() || item?._id?.toString() || index.toString(),
};

/**
 * Get optimized FlatList props for a given item height.
 * Pass the estimated/fixed height of each item for best scroll performance.
 */
export function getOptimizedFlatListProps(itemHeight: number) {
  const itemsPerScreen = Math.ceil(SCREEN_HEIGHT / itemHeight);

  return {
    ...flatListDefaults,
    initialNumToRender: itemsPerScreen + 2,
    windowSize: Math.max(5, Math.ceil(itemsPerScreen * 1.5)),
    maxToRenderPerBatch: Math.max(4, itemsPerScreen),
    getItemLayout: (_: any, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
  };
}

/**
 * Pre-built configs for common list item heights in Sliplly.
 */
export const listConfigs = {
  /** Trip cards (~120px) */
  trips: getOptimizedFlatListProps(120),

  /** Compact list items (~64px) */
  compact: getOptimizedFlatListProps(64),

  /** Driver/Vehicle cards (~80px) */
  cards: getOptimizedFlatListProps(80),

  /** Notification items (~72px) */
  notifications: getOptimizedFlatListProps(72),

  /** Large detail cards (~200px) */
  detail: getOptimizedFlatListProps(200),
};

export default listConfigs;
