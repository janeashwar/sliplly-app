import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { toast } from '../src/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography, type Colors } from '../src/theme/colors';
import { useTheme } from '../src/context/ThemeContext';
import PageLayout from '../src/components/PageLayout';
import { useRouter } from 'expo-router';
import GlassCard from '../src/components/common/GlassCard';
import authApi, { User } from '../src/api/auth';

function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export default function ProfileScreen() {
  const { colors, statusBadges, shadows, isDark } = useTheme();
  const styles = getStyles(colors, isDark, shadows);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await authApi.getCurrentUser();
      setUser(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const PROFILE = {
    name: user?.agencyName || 'Sliplly Agency',
    contactPerson: user ? `${user.firstName} ${user.lastName}` : 'User',
    email: user?.email || '—',
    phone: user?.phone || '—',
    address: '—',
    memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—',
    initials: user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'SA',
  };

  if (loading) {
    return (
      <PageLayout title="Profile">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xxxxl * 2 }}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[typography.body, { color: colors.text.tertiary, marginTop: spacing.md }]}>Loading profile...</Text>
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Profile">
      {/* Profile Card with glassmorphism */}
      <GlassCard variant="hero" style={styles.profileCard}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{PROFILE.initials}</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={12} color="#000" />
          </View>
        </View>

        {/* Name & Role */}
        <Text style={styles.agencyName}>{PROFILE.name}</Text>
        <Text style={styles.contactPerson}>{PROFILE.contactPerson}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="briefcase-outline" size={12} color={colors.accent.primary} />
          <Text style={styles.roleText}>Fleet Manager</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.totalTrips || 0}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(user?.totalRevenue || 0)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.activeDrivers || 0}</Text>
            <Text style={styles.statLabel}>Drivers</Text>
          </View>
        </View>
      </GlassCard>

      {/* Contact Info */}
      <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>
      <GlassCard variant="default" style={styles.infoCard}>
        <View style={[styles.infoRow, styles.infoBorder]}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="mail-outline" size={18} color={colors.text.secondary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{PROFILE.email}</Text>
          </View>
        </View>
        <View style={[styles.infoRow, styles.infoBorder]}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="call-outline" size={18} color={colors.text.secondary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{PROFILE.phone}</Text>
          </View>
        </View>
        <View style={[styles.infoRow, styles.infoBorder]}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="location-outline" size={18} color={colors.text.secondary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{PROFILE.address}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>{PROFILE.memberSince}</Text>
          </View>
        </View>
      </GlassCard>

      {/* Quick Links */}
      <Text style={styles.sectionTitle}>QUICK LINKS</Text>
      <GlassCard variant="default" style={styles.linksCard}>
        <Pressable
          style={[styles.linkItem, styles.linkBorder]}
          onPress={() => router.push('/settings')}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="settings-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.linkLabel}>Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
        </Pressable>
        <Pressable
          style={[styles.linkItem, styles.linkBorder]}
          onPress={() => router.push('/packages')}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="cube-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.linkLabel}>My Packages</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
        </Pressable>
        <Pressable
          style={[styles.linkItem, styles.linkBorder]}
          onPress={() => router.push('/plans')}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="ribbon-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.linkLabel}>Subscription Plans</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
        </Pressable>
        <Pressable style={styles.linkItem} onPress={() => router.push('/wallet')}>
          <View style={styles.linkLeft}>
            <Ionicons name="wallet-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.linkLabel}>Wallet</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
        </Pressable>
      </GlassCard>

      {/* Edit Profile Button */}
      <Pressable style={styles.editBtn} onPress={() => toast.info('Profile editing will be available soon!', 'Coming Soon')}>
        <Ionicons name="create-outline" size={18} color="#000" />
        <Text style={styles.editBtnText}>Edit Profile</Text>
      </Pressable>

      <View style={{ height: spacing.xl }} />
    </PageLayout>
  );
}

const getStyles = (colors: Colors, isDark: boolean, shadows: any) => StyleSheet.create({
  // Profile Card
  profileCard: {
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg.surface,
  },
  agencyName: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  contactPerson: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent.dim,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  roleText: {
    ...typography.caption,
    color: colors.accent.primary,
    fontWeight: '600',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.statSmall,
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: 18,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.subtle,
  },

  // Section
  sectionTitle: {
    ...typography.label,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },

  // Info Card
  infoCard: {
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.body,
    color: colors.text.primary,
  },

  // Quick Links
  linksCard: {
    marginBottom: spacing.xl,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  linkBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  linkLabel: {
    ...typography.body,
    color: colors.text.primary,
  },

  // Edit Profile
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  editBtnText: {
    ...typography.bodyMedium,
    color: '#000',
    fontWeight: '700',
  },
});
