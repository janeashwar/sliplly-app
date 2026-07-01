import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { toast } from '../src/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography, type Colors } from '../src/theme/colors';
import { useTheme } from '../src/context/ThemeContext';
import { PressableCard } from '../src/components/common';
import PageLayout from '../src/components/PageLayout';
import EmptyState from '../src/components/common/EmptyState';
import packagesApi, { Package as ApiPackage } from '../src/api/packages';

interface PackageData {
  id: string;
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  price: number;
  duration: string;
  features: string[];
  isActive: boolean;
  vehicleLimit: string;
  driverLimit: string;
}

// Packages loaded from API

function formatPrice(price: number): string {
  return '₹' + price.toLocaleString('en-IN');
}

export default function PackagesScreen() {
  const { colors, statusBadges, shadows, isDark } = useTheme();
  const styles = getStyles(colors, isDark, shadows);

  const [packagesData, setPackagesData] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPackages = useCallback(async () => {
    try {
      const data = await packagesApi.list();
      const list = Array.isArray(data) ? data : (data as any).content || (data as any).packages || [];
      const normalized: PackageData[] = list.map((p: any) => ({
        id: p.id,
        name: p.name || '',
        icon: 'car-outline' as const,
        price: p.baseRate || p.basePrice || 0,
        duration: '/month',
        features: [
          p.includedKm ? `${p.includedKm} km included` : '',
          p.includedHours ? `${p.includedHours} hours included` : '',
          p.ratePerKm ? `₹${p.ratePerKm}/km extra` : '',
          p.ratePerHour ? `₹${p.ratePerHour}/hr extra` : '',
        ].filter(Boolean),
        isActive: p.status === 'ACTIVE' || p.isActive || false,
        vehicleLimit: String(p.vehicleLimit || '—'),
        driverLimit: String(p.driverLimit || '—'),
      }));
      setPackagesData(normalized);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, []);

  const activePackage = packagesData.find((p) => p.isActive);

  return (
    <PageLayout title="Packages">
      {/* Active Package Summary */}
      {activePackage && (
        <View style={styles.activeBanner}>
          <View style={styles.activeBannerLeft}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.accent.primary} />
            <Text style={styles.activeBannerText}>
              Active: <Text style={styles.activeBannerName}>{activePackage.name}</Text>
            </Text>
          </View>
          <Text style={styles.activeBannerPrice}>
            {formatPrice(activePackage.price)}{activePackage.duration}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xxxxl * 2 }}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[typography.body, { color: colors.text.tertiary, marginTop: spacing.md }]}>Loading packages...</Text>
        </View>
      ) : packagesData.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title="No packages available"
          subtitle="Packages will appear here once configured"
        />
      ) : packagesData.map((pkg) => (
        <PressableCard
          key={pkg.id}
          style={[styles.card, pkg.isActive && styles.cardActive]}
          onPress={() => toast.info(`Price: ${formatPrice(pkg.price)}${pkg.duration}\nVehicles: ${pkg.vehicleLimit}\nDrivers: ${pkg.driverLimit}\n\nFeatures:\n${pkg.features.join('\n')}`, pkg.name)}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconWrap, pkg.isActive && styles.iconWrapActive]}>
                <Ionicons
                  name={pkg.icon}
                  size={22}
                  color={pkg.isActive ? colors.accent.primary : colors.text.secondary}
                />
              </View>
              <View>
                <Text style={styles.pkgName}>{pkg.name}</Text>
                <Text style={styles.pkgLimits}>
                  {pkg.vehicleLimit} vehicles · {pkg.driverLimit} drivers
                </Text>
              </View>
            </View>
            {pkg.isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ACTIVE</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.priceValue}>{formatPrice(pkg.price)}</Text>
            <Text style={styles.pricePeriod}>{pkg.duration}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Features */}
          <View style={styles.featuresList}>
            {pkg.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons
                  name={pkg.isActive ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={pkg.isActive ? colors.accent.primary : colors.text.tertiary}
                />
                <Text style={[styles.featureText, pkg.isActive && styles.featureTextActive]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          {!pkg.isActive && (
            <Pressable style={styles.ctaBtn} onPress={() => toast.info('Package upgrades will be available soon!', 'Coming Soon')}>
              <Text style={styles.ctaBtnText}>
                {pkg.price > (activePackage?.price ?? 0) ? 'Upgrade' : 'Downgrade'}
              </Text>
            </Pressable>
          )}
        </PressableCard>
      ))}

      <View style={{ height: spacing.xl }} />
    </PageLayout>
  );
}

const getStyles = (colors: Colors, isDark: boolean, shadows: any) => StyleSheet.create({
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accent.dim,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.accent.primary + '30',
  },
  activeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeBannerText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  activeBannerName: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  activeBannerPrice: {
    ...typography.caption,
    color: colors.accent.primary,
    fontWeight: '600',
  },

  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.md,
     ...(!isDark ? shadows.low : {}),
  },
  cardActive: {
    borderColor: colors.accent.primary,
    borderWidth: 1.5,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.accent.dim,
  },
  pkgName: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  pkgLimits: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },

  activeBadge: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  activeBadgeText: {
    ...typography.label,
    color: '#000',
    fontWeight: '700',
    fontSize: 10,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: spacing.md,
  },
  priceValue: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
  },
  pricePeriod: {
    ...typography.body,
    color: colors.text.tertiary,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginBottom: spacing.md,
  },

  featuresList: {
    gap: spacing.sm,
  },
  featureRow: {
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

  ctaBtn: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  ctaBtnText: {
    ...typography.bodyMedium,
    color: '#000',
    fontWeight: '700',
  },
});
