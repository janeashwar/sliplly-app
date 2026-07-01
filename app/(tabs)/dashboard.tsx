import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { toast } from '../../src/utils/toast';
import { hapticTap } from '../../src/utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography } from '../../src/theme/colors';
import { formatCurrency } from '../../src/data/placeholder';
import dashboardApi, { DashboardStats } from '../../src/api/dashboard';

import { useTheme } from '../../src/context/ThemeContext';
import { useScroll } from '../../src/context/ScrollContext';
import CountingNumber from '../../src/components/animations/CountingNumber';
import { RefreshIndicator } from '../../src/components/animations/PullToRefresh';
import GlassCard from '../../src/components/common/GlassCard';
import TabScreenTransition from '../../src/components/TabScreenTransition';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { colors, statusBadges, shadows, isDark } = useTheme();
  const styles = createStyles(colors, shadows, isDark);
  const { setScrollPosition } = useScroll();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(err?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setScrollPosition(contentOffset.y, contentSize.height, layoutMeasurement.height);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    hapticTap();
    fetchStats();
  }, [fetchStats]);

  // Fallback values when stats aren't loaded yet
  const totalRevenue = stats?.totalRevenue ?? stats?.dutySlipBalance ?? 0;
  const activeTrips = stats?.pendingTrips ?? stats?.activeTrips ?? 0;
  const completionRate = stats?.completionRate ?? (stats?.completedTrips && stats?.thisMonthTrips ? Math.round((stats.completedTrips / stats.thisMonthTrips) * 100) : 0);
  const avgTripDuration = stats?.avgTripDuration ?? '—';
  const monthlyTrips = stats?.monthlyTrips ?? [];
  const recentActivity = stats?.recentActivity ?? stats?.recentTrips ?? [];

  if (loading) {
    return (
      <TabScreenTransition tabIndex={0}>
        <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[typography.body, { color: colors.text.tertiary, marginTop: spacing.md }]}>Loading dashboard...</Text>
        </View>
      </TabScreenTransition>
    );
  }

  return (
    <TabScreenTransition tabIndex={0}>
    <View style={styles.screen}>
      {/* Custom refresh indicator */}
      <RefreshIndicator refreshing={refreshing} tintColor={colors.accent.primary} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 80, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={['transparent']}
          />
        }
      >
        {/* Error state */}
        {error && (
          <View style={{ padding: spacing.md, marginBottom: spacing.md, backgroundColor: colors.semantic.error + '18', borderRadius: radius.md }}>
            <Text style={{ color: colors.semantic.error, ...typography.caption }}>{error}</Text>
          </View>
        )}

        {/* Hero Card — animated entrance with glassmorphism */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(100).springify()}
        >
          <GlassCard variant="hero" style={styles.heroCard}>
            <Text style={styles.heroLabel}>TOTAL REVENUE</Text>
            <CountingNumber
              value={totalRevenue}
              duration={1400}
              delay={300}
              prefix="₹"
              formatter={(v) => '₹' + v.toLocaleString('en-IN')}
              style={styles.heroValue}
            />
            <View style={styles.heroMeta}>
              <View style={styles.heroBadge}>
                <Ionicons name="trending-up-outline" size={14} color={colors.semantic.success} />
                <Text style={styles.heroBadgeText}>+12.4%</Text>
              </View>
              <Text style={styles.heroPeriod}>This month</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Stats Row — staggered fade+slide entrance */}
        <View style={styles.statsRow}>
          {[
            {
              icon: 'car-outline', label: 'Active Trips',
              value: activeTrips, suffix: '',
              accent: colors.semantic.info,
              info: `${activeTrips} trips currently in progress`,
              title: 'Active Trips',
            },
            {
              icon: 'checkmark-circle-outline', label: 'Completion',
              value: completionRate, suffix: '%',
              accent: colors.semantic.success,
              info: `${completionRate}% trips completed successfully`,
              title: 'Completion Rate',
            },
            {
              icon: 'time-outline', label: 'Avg Duration',
              value: null, displayValue: avgTripDuration,
              accent: colors.semantic.warning,
              info: avgTripDuration,
              title: 'Avg Trip Duration',
            },
          ].map((stat, index) => (
            <Animated.View
              key={stat.label}
              entering={FadeInUp.duration(500).delay(200 + index * 100).springify()}
              style={{ flex: 1 }}
            >
              <GlassCard variant="stat">
                <Pressable
                  style={styles.statCard}
                  onPress={() => { hapticTap(); toast.info(stat.info, stat.title); }}
                >
                  <Ionicons name={stat.icon as any} size={20} color={stat.accent} />
                  {stat.value !== null ? (
                    <CountingNumber
                      value={stat.value!}
                      duration={1000}
                      delay={400 + index * 150}
                      suffix={stat.suffix}
                      style={styles.statValue}
                    />
                  ) : (
                    <Text style={styles.statValue}>{stat.displayValue}</Text>
                  )}
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </Pressable>
              </GlassCard>
            </Animated.View>
          ))}
        </View>

        {/* Monthly Trend — animated chart bars */}
        {monthlyTrips.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(500)}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TRIPS BY MONTH</Text>
              <GlassCard variant="default" style={styles.chartCard}>
                <View style={styles.chartBars}>
                  {monthlyTrips.map((item, index) => {
                    const maxCount = Math.max(...monthlyTrips.map(m => m.count));
                    const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                    return (
                      <ChartBar
                        key={item.month}
                        month={item.month}
                        count={item.count}
                        heightPercent={heightPercent}
                        delay={600 + index * 80}
                        accentColor={colors.accent.primary}
                        textColor={colors.text.secondary}
                        labelColor={colors.text.tertiary}
                        trackColor={colors.bg.base}
                      />
                    );
                  })}
                </View>
              </GlassCard>
            </View>
          </Animated.View>
        )}

        {/* Recent Activity — staggered list entrance */}
        {recentActivity.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(700)}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
              <GlassCard variant="activity" style={styles.activityCard}>
                {recentActivity.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    entering={SlideInRight.duration(400).delay(800 + index * 100).springify()}
                  >
                    <Pressable
                      style={[
                        styles.activityItem,
                        index < recentActivity.length - 1 && styles.activityItemBorder,
                      ]}
                      onPress={() => { hapticTap(); toast.info(`${item.detail}\n${item.time}`, item.action); }}
                    >
                      <View style={styles.activityDot} />
                      <View style={styles.activityContent}>
                        <Text style={styles.activityAction}>{item.action}</Text>
                        <Text style={styles.activityDetail}>{item.detail}</Text>
                      </View>
                      <Text style={styles.activityTime}>{item.time}</Text>
                    </Pressable>
                  </Animated.View>
                ))}
              </GlassCard>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Dashboard</Text>
          </View>
        </View>
      </View>
    </View>
    </TabScreenTransition>
  );
}

// ── Animated Chart Bar ──
function ChartBar({
  month, count, heightPercent, delay,
  accentColor, textColor, labelColor, trackColor,
}: {
  month: string; count: number; heightPercent: number; delay: number;
  accentColor: string; textColor: string; labelColor: string; trackColor: string;
}) {
  const barHeight = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    barHeight.value = withDelay(
      delay,
      withSpring(heightPercent, {
        stiffness: 120,
        damping: 14,
        mass: 0.8,
      })
    );
  }, [heightPercent]);

  const barStyle = useAnimatedStyle(() => ({
    height: `${barHeight.value}%`,
    opacity: opacity.value,
  }));

  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[chartStyles.barValue, { color: textColor }]}>{count}</Text>
      <View style={[chartStyles.barTrack, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            chartStyles.barFill,
            { backgroundColor: accentColor },
            barStyle,
          ]}
        />
      </View>
      <Text style={[chartStyles.barLabel, { color: labelColor }]}>{month}</Text>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  barValue: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  barTrack: {
    width: 24,
    height: 80,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: radius.sm,
  },
  barLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});

const createStyles = (colors: any, shadows: any, isDark: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg.base },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg.base,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  titleSection: { flex: 1 },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },

  heroCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroLabel: { ...typography.caption, color: colors.text.tertiary, fontWeight: '600', letterSpacing: 1 },
  heroValue: { ...typography.stat, color: colors.text.primary, marginTop: spacing.sm },
  heroMeta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.semantic.success + '18',
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full,
  },
  heroBadgeText: { ...typography.caption, color: colors.semantic.success, fontWeight: '600' },
  heroPeriod: { ...typography.caption, color: colors.text.tertiary },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1, padding: spacing.md, alignItems: 'center', gap: spacing.xs,
  },
  statValue: { ...typography.statSmall, color: colors.text.primary },
  statLabel: { ...typography.caption, color: colors.text.tertiary, textAlign: 'center' },

  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.label, color: colors.text.tertiary, marginBottom: spacing.sm },
  chartCard: {
    padding: spacing.lg,
  },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },

  activityCard: {
    padding: spacing.md,
  },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent.primary },
  activityContent: { flex: 1 },
  activityAction: { ...typography.bodyMedium, color: colors.text.primary },
  activityDetail: { ...typography.caption, color: colors.text.tertiary },
  activityTime: { ...typography.caption, color: colors.text.tertiary },
  activityItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
});
