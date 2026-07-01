/**
 * Lazy-loaded Screens — Code splitting for faster initial load
 *
 * Uses React.lazy + Suspense to defer loading screen code
 * until the user actually navigates to it.
 */

import React, { Suspense, ComponentType } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// ── Loading Fallback ──
function ScreenLoader() {
  return (
    <View style={loaderStyles.container}>
      <ActivityIndicator size="large" color="#d6ed6a" />
    </View>
  );
}

const loaderStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
  },
});

/**
 * HOC that wraps a screen component with React.lazy + Suspense.
 * Usage: const LazyScreen = lazyScreen(() => import('./MyScreen'));
 */
export function lazyScreen<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(factory);
}

/**
 * Wrapper that provides Suspense boundary for lazy screens.
 */
export function LazyBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ScreenLoader />}>
      {children}
    </Suspense>
  );
}

/**
 * Lazy-loaded heavy screens (non-tab screens that are navigated to on demand).
 * These don't need to be in the initial bundle.
 *
 * Usage in _layout.tsx:
 *   import { LazyVehiclesScreen, LazyBoundary } from '../src/performance/lazyScreens';
 *   <Stack.Screen name="vehicles">
 *     {() => <LazyBoundary><LazyVehiclesScreen /></LazyBoundary>}
 *   </Stack.Screen>
 */

// Heavy screens — lazy load these
export const LazyVehiclesScreen = lazyScreen(() => import('../../app/vehicles'));
export const LazyDriversScreen = lazyScreen(() => import('../../app/drivers'));
export const LazyGuestsScreen = lazyScreen(() => import('../../app/guests'));
export const LazyPackagesScreen = lazyScreen(() => import('../../app/packages'));
export const LazyPlansScreen = lazyScreen(() => import('../../app/plans'));
export const LazyWalletScreen = lazyScreen(() => import('../../app/wallet'));
export const LazyProfileScreen = lazyScreen(() => import('../../app/profile'));
export const LazyReportsScreen = lazyScreen(() => import('../../app/reports'));
export const LazyReviewsScreen = lazyScreen(() => import('../../app/reviews'));
export const LazySettingsScreen = lazyScreen(() => import('../../app/settings'));
export const LazyOfferMarketplaceScreen = lazyScreen(() => import('../../app/offer-marketplace'));
export const LazyMyOffersScreen = lazyScreen(() => import('../../app/my-offers'));
export const LazyUserManagementScreen = lazyScreen(() => import('../../app/user-management'));
export const LazySendNotificationScreen = lazyScreen(() => import('../../app/send-notification'));
export const LazyTwoFactorSetupScreen = lazyScreen(() => import('../../app/two-factor-setup'));

export default {
  lazyScreen,
  LazyBoundary,
};
