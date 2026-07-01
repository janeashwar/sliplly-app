import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { toast } from '../src/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography, type Colors } from '../src/theme/colors';
import { useTheme } from '../src/context/ThemeContext';
import PageLayout from '../src/components/PageLayout';
import plansApi, { Plan as PlanType } from '../src/api/plans';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  vehicleLimit: string;
  driverLimit: string;
  isCurrent: boolean;
  isPopular?: boolean;
}

function formatPrice(price: number): string {
  return '₹' + price.toLocaleString('en-IN');
}

export default function PlansScreen() {
  const { colors, statusBadges, shadows, isDark } = useTheme();
  const styles = getStyles(colors, isDark, shadows);

  const [plansData, setPlansData] = useState<PlanType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    try {
      const data = await plansApi.list();
      const list = Array.isArray(data) ? data : (data as any).plans || [];
      setPlansData(list);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, []);

  const currentPlan = plansData.find((p) => p.isCurrent || p.isActive);

  if (loading) {
    return (
      <PageLayout title="Plans">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xxxxl * 2 }}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[typography.body, { color: colors.text.tertiary, marginTop: spacing.md }]}>Loading plans...</Text>
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Plans">
      {/* Current Plan Card */}
      {currentPlan && (
      <View style={styles.currentPlanCard}>
        <View style={styles.currentPlanHeader}>
          <View style={styles.currentBadge}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#000" />
            <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
          </View>
        </View>
        <Text style={styles.currentPlanName}>{currentPlan.name}</Text>
        <Text style={styles.currentPlanPrice}>{formatPrice(currentPlan.price)}<Text style={styles.currentPlanPeriod}>{currentPlan.period || '/month'}</Text></Text>
      </View>
      )}

      {/* Section Title */}
      <Text style={styles.sectionTitle}>COMPARE PLANS</Text>

      {/* Plan Cards */}
      {plansData.map((plan: PlanType) => (
        <View key={plan.id} style={[styles.planCard, (plan.isCurrent || plan.isActive) && styles.planCardActive]}>
          {plan.isPopular && !(plan.isCurrent || plan.isActive) && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>POPULAR</Text>
            </View>
          )}

          <View style={styles.planCardHeader}>
            <View>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.planLimits}>
                <Ionicons name="car-outline" size={14} color={colors.text.tertiary} />
                <Text style={styles.planLimitsText}>{plan.vehicleLimit} vehicles</Text>
                <Text style={styles.planLimitsDot}>·</Text>
                <Ionicons name="people-outline" size={14} color={colors.text.tertiary} />
                <Text style={styles.planLimitsText}>{plan.driverLimit} drivers</Text>
              </View>
            </View>
            <View style={styles.planPriceCol}>
              <Text style={styles.planPrice}>{formatPrice(plan.price)}</Text>
              <Text style={styles.planPeriod}>{plan.period}</Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresWrap}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons
                  name={plan.isCurrent ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={16}
                  color={plan.isCurrent ? colors.accent.primary : colors.text.tertiary}
                />
                <Text style={[styles.featureText, plan.isCurrent && styles.featureTextActive]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          {(plan.isCurrent || plan.isActive) ? (
            <View style={styles.activeBtn}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.accent.primary} />
              <Text style={styles.activeBtnText}>Your current plan</Text>
            </View>
          ) : (
            <Pressable
              style={[
                styles.ctaBtn,
                plan.price < 2999 && styles.ctaBtnSecondary,
              ]}
              onPress={() => toast.info('Plan switching will be available soon!', 'Coming Soon')}
            >
              <Text
                style={[
                  styles.ctaBtnText,
                  plan.price < 2999 && styles.ctaBtnTextSecondary,
                ]}
              >
                {plan.price > 2999 ? 'Upgrade to ' + plan.name : 'Switch to ' + plan.name}
              </Text>
            </Pressable>
          )}
        </View>
      ))}

      <View style={{ height: spacing.xl }} />
    </PageLayout>
  );
}

const getStyles = (colors: Colors, isDark: boolean, shadows: any) => StyleSheet.create({
  // Current Plan
  currentPlanCard: {
    backgroundColor: colors.accent.dim,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.accent.primary + '40',
  },
  currentPlanHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  currentBadgeText: {
    ...typography.label,
    color: '#000',
    fontWeight: '700',
    fontSize: 10,
  },
  currentPlanName: {
    ...typography.h1,
    color: colors.text.primary,
    fontWeight: '700',
  },
  currentPlanPrice: {
    ...typography.h2,
    color: colors.accent.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  currentPlanPeriod: {
    ...typography.body,
    color: colors.text.tertiary,
    fontWeight: '400',
  },
  currentPlanExpiry: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },

  // Usage Stats
  usageRow: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.accent.primary + '20',
  },
  usageItem: {
    flex: 1,
    alignItems: 'center',
  },
  usageValue: {
    ...typography.statSmall,
    color: colors.text.primary,
    fontWeight: '700',
  },
  usageLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  usageBarTrack: {
    width: '80%',
    height: 4,
    backgroundColor: colors.bg.overlay,
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
  },
  usageDivider: {
    width: 1,
    backgroundColor: colors.accent.primary + '20',
  },

  // Section
  sectionTitle: {
    ...typography.label,
    color: colors.text.tertiary,
    marginBottom: spacing.lg,
  },

  // Plan Cards
  planCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.md,
     ...(!isDark ? shadows.low : {}),
  },
  planCardActive: {
    borderColor: colors.accent.primary,
    borderWidth: 1.5,
  },

  popularBadge: {
    position: 'absolute',
    top: -1,
    right: spacing.lg,
    backgroundColor: colors.semantic.info,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
  },
  popularBadgeText: {
    ...typography.label,
    color: '#FFF',
    fontWeight: '700',
    fontSize: 10,
  },

  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  planName: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  planLimits: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  planLimitsText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  planLimitsDot: {
    color: colors.text.tertiary,
    marginHorizontal: 2,
  },
  planPriceCol: {
    alignItems: 'flex-end',
  },
  planPrice: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  planPeriod: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  featuresWrap: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  featureTextActive: {
    color: colors.text.primary,
  },

  // Active button
  activeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.dim,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent.primary + '30',
  },
  activeBtnText: {
    ...typography.bodyMedium,
    color: colors.accent.primary,
    fontWeight: '600',
  },

  // CTA buttons
  ctaBtn: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaBtnText: {
    ...typography.bodyMedium,
    color: '#000',
    fontWeight: '700',
  },
  ctaBtnSecondary: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  ctaBtnTextSecondary: {
    color: colors.text.primary,
    fontWeight: '600',
  },
});
