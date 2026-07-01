/**
 * Shimmer — Premium skeleton loading component
 * Creates a smooth left-to-right shimmer sweep over placeholder bones.
 * Uses Reanimated for 60fps performance.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

// ── Animated LinearGradient wrapper ──
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// ── Single shimmer sweep animation ──
function ShimmerSweep({ children }: { children: React.ReactNode }) {
  const progress = useSharedValue(0);
  const { isDark } = useTheme();

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const sweepStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [-300, 300]);
    return {
      transform: [{ translateX }],
    };
  });

  const shimmerColors = isDark
    ? ['transparent', 'rgba(255,255,255,0.06)', 'transparent']
    : ['transparent', 'rgba(255,255,255,0.8)', 'transparent'];

  return (
    <View style={{ overflow: 'hidden' }}>
      {children}
      <AnimatedLinearGradient
        colors={shimmerColors as any}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFill, sweepStyle]}
        pointerEvents="none"
      />
    </View>
  );
}

// ── Skeleton Bone ──
interface BoneProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function ShimmerBone({ width, height, borderRadius = 8, style }: BoneProps) {
  const { colors } = useTheme();

  return (
    <ShimmerSweep>
      <View
        style={[
          {
            width: width as any,
            height,
            borderRadius,
            backgroundColor: colors.bg.elevated,
          },
          style,
        ]}
      />
    </ShimmerSweep>
  );
}

// ── Dashboard Skeleton ──
export function DashboardSkeleton() {
  const { colors, isDark, shadows } = useTheme();

  return (
    <View style={{ padding: 16, gap: 12 }}>
      {/* Hero stat card */}
      <View style={[skeletonStyles.heroCard, { backgroundColor: colors.bg.surface, borderColor: colors.border.subtle }, !isDark && shadows.low]}>
        <ShimmerBone width={100} height={12} />
        <ShimmerBone width={180} height={32} style={{ marginTop: 8 }} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <ShimmerBone width={70} height={22} borderRadius={11} />
          <ShimmerBone width={60} height={22} borderRadius={11} />
        </View>
      </View>

      {/* Stat cards row */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[skeletonStyles.statCard, { backgroundColor: colors.bg.surface, borderColor: colors.border.subtle }, !isDark && shadows.low]}>
            <ShimmerBone width={20} height={20} borderRadius={10} />
            <ShimmerBone width={40} height={18} style={{ marginTop: 6 }} />
            <ShimmerBone width={50} height={10} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Chart area */}
      <View style={[skeletonStyles.chartCard, { backgroundColor: colors.bg.surface, borderColor: colors.border.subtle }, !isDark && shadows.low]}>
        <ShimmerBone width={100} height={10} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, height: 80, alignItems: 'flex-end' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ShimmerBone key={i} width={24} height={Math.floor(Math.random() * 50) + 30} borderRadius={4} />
          ))}
        </View>
      </View>

      {/* Activity items */}
      <View style={[skeletonStyles.activityCard, { backgroundColor: colors.bg.surface, borderColor: colors.border.subtle }, !isDark && shadows.low]}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={skeletonStyles.activityItem}>
            <ShimmerBone width={8} height={8} borderRadius={4} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <ShimmerBone width="60%" height={12} />
              <ShimmerBone width="40%" height={10} style={{ marginTop: 4 }} />
            </View>
            <ShimmerBone width={40} height={10} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Trips List Skeleton ──
export function TripsListSkeleton() {
  const { colors, isDark, shadows } = useTheme();

  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[skeletonStyles.tripCard, { backgroundColor: colors.bg.surface, borderColor: colors.border.subtle }, !isDark && shadows.low]}>
          {/* Status badge + amount */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <ShimmerBone width={80} height={22} borderRadius={11} />
            <ShimmerBone width={70} height={16} />
          </View>
          {/* Guest row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 }}>
            <ShimmerBone width={14} height={14} borderRadius={7} />
            <ShimmerBone width={100} height={12} />
            <ShimmerBone width={70} height={10} style={{ marginLeft: 12 }} />
          </View>
          {/* Route */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <ShimmerBone width={10} height={10} borderRadius={5} />
              <ShimmerBone width={2} height={30} style={{ marginVertical: 2 }} />
              <ShimmerBone width={10} height={10} borderRadius={5} />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <ShimmerBone width="70%" height={12} />
              <ShimmerBone width="55%" height={12} />
            </View>
          </View>
          {/* Meta row */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
            <ShimmerBone width={60} height={10} />
            <ShimmerBone width={50} height={10} />
            <ShimmerBone width={80} height={10} />
          </View>
          {/* Footer */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border.subtle, paddingTop: 8 }}>
            <ShimmerBone width={100} height={10} />
            <ShimmerBone width={80} height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Profile Skeleton ──
export function ProfileSkeleton() {
  const { colors, isDark, shadows } = useTheme();

  return (
    <View style={{ padding: 16, gap: 20 }}>
      {/* Profile card */}
      <View style={[skeletonStyles.profileCard, { backgroundColor: colors.bg.surface, borderColor: colors.border.subtle }, !isDark && shadows.low]}>
        <ShimmerBone width={88} height={88} borderRadius={44} />
        <ShimmerBone width={140} height={20} style={{ marginTop: 12 }} />
        <ShimmerBone width={100} height={14} style={{ marginTop: 6 }} />
        <ShimmerBone width={90} height={22} borderRadius={11} style={{ marginTop: 10 }} />
        {/* Stats row */}
        <View style={{ flexDirection: 'row', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border.subtle, width: '100%' }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <ShimmerBone width={50} height={16} />
              <ShimmerBone width={40} height={10} />
            </View>
          ))}
        </View>
      </View>

      {/* Info card */}
      <View>
        <ShimmerBone width={120} height={10} style={{ marginBottom: 8 }} />
        <View style={[skeletonStyles.infoCard, { backgroundColor: colors.bg.surface, borderColor: colors.border.subtle }, !isDark && shadows.low]}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={skeletonStyles.infoRow}>
              <ShimmerBone width={32} height={32} borderRadius={8} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ShimmerBone width={40} height={10} />
                <ShimmerBone width="80%" height={12} style={{ marginTop: 4 }} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Links card */}
      <View>
        <ShimmerBone width={80} height={10} style={{ marginBottom: 8 }} />
        <View style={[skeletonStyles.infoCard, { backgroundColor: colors.bg.surface, borderColor: colors.border.subtle }, !isDark && shadows.low]}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={skeletonStyles.infoRow}>
              <ShimmerBone width={20} height={20} borderRadius={4} />
              <ShimmerBone width={100} height={12} style={{ marginLeft: 12 }} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  heroCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  activityCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  tripCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  profileCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
});
