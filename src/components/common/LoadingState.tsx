import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DashboardSkeleton, TripsListSkeleton, ProfileSkeleton } from '../animations/Shimmer';
import { colors, spacing, radius } from '../../theme/colors';

type LoadingType = 'card' | 'list' | 'detail' | 'dashboard' | 'trips' | 'profile';

interface LoadingStateProps {
  type?: LoadingType;
}

export default function LoadingState({ type = 'list' }: LoadingStateProps) {
  if (type === 'dashboard') {
    return <DashboardSkeleton />;
  }

  if (type === 'trips') {
    return <TripsListSkeleton />;
  }

  if (type === 'profile') {
    return <ProfileSkeleton />;
  }

  if (type === 'card') {
    return (
      <View style={styles.container}>
        <DashboardSkeleton />
      </View>
    );
  }

  if (type === 'detail') {
    return (
      <View style={styles.container}>
        <ProfileSkeleton />
      </View>
    );
  }

  // type === 'list' — default shimmer list
  return <TripsListSkeleton />;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
