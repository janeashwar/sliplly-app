/**
 * Performance Module — Optimization utilities for Sliplly
 *
 * Components:
 * - memoizedComponents: React.memo wrapped components for fewer re-renders
 * - flatListConfig: Pre-tuned FlatList props for smooth scrolling
 * - lazyScreens: React.lazy code splitting for faster initial load
 * - interactionManager: Defer heavy work until after animations
 *
 * Usage:
 *   import { listConfigs, MemoizedStatusBadge, runAfterInteractions } from '../performance';
 */

export {
  MemoizedStatusBadge,
  MemoizedActionButton,
  MemoizedInfoRow,
  MemoizedSectionHeader,
  MemoizedEmptyState,
} from './memoizedComponents';

export {
  flatListDefaults,
  getOptimizedFlatListProps,
  listConfigs,
} from './flatListConfig';

export {
  lazyScreen,
  LazyBoundary,
} from './lazyScreens';

export {
  runAfterInteractions,
  runAfterInteractionsWithTimeout,
  createDeferredTask,
} from './interactionManager';
