import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { toast } from '../src/utils/toast';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { spacing, radius, typography, type Colors } from '../src/theme/colors';
import { useTheme } from '../src/context/ThemeContext';

// ── Types ──
type UserRole = 'Partner Admin' | 'Partner User';
type UserStatus = 'Active' | 'Inactive';

interface StaffUser {
  id: string;
  name: string;
  loginId: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

// ── Mock Data ──
const MOCK_STAFF: StaffUser[] = [
  { id: '1', name: 'Rajesh Kumar', loginId: 'rajesh.k', role: 'Partner Admin', status: 'Active', createdAt: '2026-01-15' },
  { id: '2', name: 'Amit Singh', loginId: 'amit.s', role: 'Partner User', status: 'Active', createdAt: '2026-02-10' },
  { id: '3', name: 'Priya Sharma', loginId: 'priya.s', role: 'Partner User', status: 'Active', createdAt: '2026-03-05' },
  { id: '4', name: 'Suresh Patel', loginId: 'suresh.p', role: 'Partner User', status: 'Inactive', createdAt: '2026-01-20' },
  { id: '5', name: 'Deepa Nair', loginId: 'deepa.n', role: 'Partner Admin', status: 'Active', createdAt: '2026-04-12' },
  { id: '6', name: 'Vikram Reddy', loginId: 'vikram.r', role: 'Partner User', status: 'Inactive', createdAt: '2026-02-28' },
];

const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  'Partner Admin': { bg: '#FBBF2418', text: '#FBBF24' },
  'Partner User': { bg: '#60A5FA18', text: '#60A5FA' },
};

const MAX_SLOTS = 10;

export default function UserManagementScreen() {
  const { colors, isDark, shadows } = useTheme();
  const styles = getStyles(colors, isDark, shadows);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [staff, setStaff] = useState<StaffUser[]>(MOCK_STAFF);

  const activeCount = staff.filter((s) => s.status === 'Active').length;

  const handleDeactivate = (user: StaffUser) => {
    if (user.role === 'Partner Admin') {
      const activeAdmins = staff.filter((s) => s.role === 'Partner Admin' && s.status === 'Active').length;
      if (activeAdmins <= 1) {
        toast.warning('At least one active Partner Admin is required.', 'Cannot Deactivate');
        return;
      }
    }
    Alert.alert(
      'Deactivate User',
      `Deactivate ${user.name}? They will lose access to the system.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            setStaff((prev) =>
              prev.map((s) => (s.id === user.id ? { ...s, status: 'Inactive' as UserStatus } : s))
            );
          },
        },
      ],
    );
  };

  const handleActivate = (user: StaffUser) => {
    if (activeCount >= MAX_SLOTS) {
      toast.warning(`Maximum ${MAX_SLOTS} active users allowed. Deactivate a user first.`, 'Slot Limit Reached');
      return;
    }
    setStaff((prev) =>
      prev.map((s) => (s.id === user.id ? { ...s, status: 'Active' as UserStatus } : s))
    );
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.substring(0, 2);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>User Management</Text>
        <Pressable
          hitSlop={12}
          onPress={() => toast.info('User creation form coming soon!', 'Create User')}
        >
          <Ionicons name="person-add-outline" size={22} color={colors.accent.primary} />
        </Pressable>
      </Animated.View>

      {/* Slot Usage */}
      <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.slotCard}>
        <View style={styles.slotHeader}>
          <Text style={styles.slotTitle}>User Slots</Text>
          <Text style={styles.slotCount}>{activeCount} / {MAX_SLOTS}</Text>
        </View>
        <View style={styles.slotBarBg}>
          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            style={[
              styles.slotBarFill,
              { width: `${(activeCount / MAX_SLOTS) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.slotHint}>{MAX_SLOTS - activeCount} slots available</Text>
      </Animated.View>

      {/* Staff List */}
      <FlatList
        data={staff}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const rc = ROLE_COLORS[item.role];
          const isActive = item.status === 'Active';
          return (
            <Animated.View
              entering={FadeInDown.delay(150 + index * 60).duration(400)}
              style={styles.userCard}
            >
              <View style={styles.userRow}>
                <View style={[styles.avatar, { backgroundColor: isActive ? colors.accent.dim : colors.bg.overlay }]}>
                  <Text style={[styles.initials, { color: isActive ? colors.accent.primary : colors.text.tertiary }]}>
                    {getInitials(item.name)}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.loginId}>{item.loginId}</Text>
                </View>
                <View style={styles.badges}>
                  <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
                    <Text style={[styles.roleText, { color: rc.text }]}>{item.role}</Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: isActive ? colors.semantic.success : colors.semantic.error }]} />
                </View>
              </View>
              <View style={styles.userActions}>
                <Text style={styles.createdText}>
                  Joined {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <Pressable
                  onPress={() => (isActive ? handleDeactivate(item) : handleActivate(item))}
                  style={[
                    styles.toggleBtn,
                    { borderColor: isActive ? colors.semantic.error : colors.semantic.success },
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: isActive ? colors.semantic.error : colors.semantic.success },
                    ]}
                  >
                    {isActive ? 'Deactivate' : 'Activate'}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

// ── Styles ──
const getStyles = (colors: Colors, isDark: boolean, shadows: any) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg.base },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { ...typography.h3, color: colors.text.primary, fontWeight: '600' },

    slotCard: {
      margin: spacing.lg,
      padding: spacing.lg,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    slotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    slotTitle: { ...typography.bodyMedium, color: colors.text.primary },
    slotCount: { ...typography.bodyMedium, color: colors.accent.primary, fontWeight: '700' },
    slotBarBg: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.bg.overlay,
      overflow: 'hidden',
    },
    slotBarFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent.primary,
    },
    slotHint: { ...typography.caption, color: colors.text.tertiary, marginTop: spacing.sm },

    listContent: { padding: spacing.lg, paddingBottom: spacing.xxxxl },

    userCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: { ...typography.bodyMedium, fontWeight: '700' },
    userInfo: { flex: 1 },
    userName: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },
    loginId: { ...typography.caption, color: colors.text.tertiary },
    badges: { alignItems: 'flex-end', gap: 6 },
    roleBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
    roleText: { ...typography.label, fontWeight: '700' },
    statusDot: { width: 8, height: 8, borderRadius: 4, alignSelf: 'center' },

    userActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    createdText: { ...typography.caption, color: colors.text.tertiary },
    toggleBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
    },
    toggleText: { ...typography.caption, fontWeight: '600' },
  });
