import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { toast } from '../src/utils/toast';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { spacing, radius, typography, type Colors } from '../src/theme/colors';
import { useTheme } from '../src/context/ThemeContext';
import { guests, trips, formatCurrency, Trip } from '../src/data/placeholder';

// Use first guest as mock data
const guest = guests[0];
const guestTrips = trips.filter((t) => t.guestName === guest.name).slice(0, 10);

export default function GuestDetailScreen() {
  const { colors, isDark, shadows, statusBadges } = useTheme();
  const styles = getStyles(colors, isDark, shadows);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [userRating, setUserRating] = useState(0);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.substring(0, 2);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => interactive && setUserRating(star)}
            hitSlop={4}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={interactive ? 28 : 16}
              color={star <= rating ? '#FBBF24' : colors.text.tertiary}
            />
          </Pressable>
        ))}
      </View>
    );
  };

  const getStatusBadge = (status: string) => {
    const key = status === 'in-progress' ? 'inProgress' : status as keyof typeof statusBadges;
    return statusBadges[key] || statusBadges.pending;
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Guest Details</Text>
        <Pressable hitSlop={12} onPress={() => toast.info('Edit guest info', 'Edit Guest')}>
          <Ionicons name="create-outline" size={22} color={colors.accent.primary} />
        </Pressable>
      </Animated.View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{getInitials(guest.name)}</Text>
          </View>
          <Text style={styles.guestName}>{guest.name}</Text>
          {guest.company && (
            <View style={styles.companyBadge}>
              <Ionicons name="business-outline" size={13} color={colors.accent.primary} />
              <Text style={styles.companyText}>{guest.company}</Text>
            </View>
          )}
          <View style={styles.contactRow}>
            <Pressable
              style={styles.contactBtn}
              onPress={() => toast.info(`Call ${guest.phone}?`, 'Call')}
            >
              <Ionicons name="call-outline" size={18} color={colors.accent.primary} />
              <Text style={styles.contactBtnText}>{guest.phone}</Text>
            </Pressable>
            {guest.email && (
              <Pressable
                style={styles.contactBtn}
                onPress={() => toast.info(`Send email to ${guest.email}?`, 'Email')}
              >
                <Ionicons name="mail-outline" size={18} color={colors.accent.primary} />
                <Text style={styles.contactBtnText}>{guest.email}</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{guest.tripCount}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.accent.primary }]}>
              {formatCurrency(guest.totalSpent)}
            </Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDate(guest.lastTripDate)}</Text>
            <Text style={styles.statLabel}>Last Trip</Text>
          </View>
        </Animated.View>

        {/* Rating */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.card}>
          <Text style={styles.cardLabel}>Rate Guest</Text>
          {renderStars(userRating, true)}
          {userRating > 0 && (
            <Text style={styles.ratingHint}>
              {userRating <= 2 ? 'Poor' : userRating === 3 ? 'Average' : userRating === 4 ? 'Good' : 'Excellent'}
            </Text>
          )}
        </Animated.View>

        {/* Relationship Manager */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.card}>
          <Text style={styles.cardLabel}>Relationship Manager</Text>
          <View style={styles.rmRow}>
            <View style={styles.rmAvatar}>
              <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
            </View>
            <View style={styles.rmInfo}>
              <Text style={styles.rmName}>Ankit Verma</Text>
              <Text style={styles.rmRole}>Senior Account Manager</Text>
            </View>
            <Pressable
              style={styles.rmCallBtn}
              onPress={() => toast.info('Call relationship manager?', 'Call')}
            >
              <Ionicons name="call-outline" size={18} color={colors.accent.primary} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Trip History */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Text style={styles.sectionTitle}>Trip History</Text>
          {guestTrips.length > 0 ? (
            guestTrips.map((trip, index) => {
              const badge = getStatusBadge(trip.status);
              const statusLabels: Record<string, string> = {
                INITIATED: 'Initiated', ASSIGNED: 'Assigned', ON_DUTY: 'On Duty',
                COMPLETED: 'Completed', FINALIZE_CHARGES: 'Finalize', CANCELLED: 'Cancelled',
              };
              const statusLabel = statusLabels[trip.status] || trip.status;
              return (
                <Pressable
                  key={trip.id}
                  style={styles.tripCard}
                  onPress={() => router.push(`/trip-details?tripId=${trip.id}`)}
                >
                  <View style={styles.tripHeader}>
                    <Text style={styles.tripTitle} numberOfLines={1}>{trip.title}</Text>
                    <View style={[styles.tripStatusBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.tripStatusText, { color: badge.text }]}>{statusLabel}</Text>
                    </View>
                  </View>
                  <View style={styles.tripRoute}>
                    <Ionicons name="navigate-outline" size={13} color={colors.text.tertiary} />
                    <Text style={styles.tripRouteText} numberOfLines={1}>
                      {trip.from} → {trip.to}
                    </Text>
                  </View>
                  <View style={styles.tripFooter}>
                    <Text style={styles.tripDate}>{trip.date}</Text>
                    <Text style={styles.tripAmount}>{formatCurrency(trip.amount || 0)}</Text>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={40} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No trips yet</Text>
            </View>
          )}
        </Animated.View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: Colors, isDark: boolean, shadows: any) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      ...typography.h3,
      color: colors.text.primary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.lg,
    },

    // Profile
    profileCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    avatarLarge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.accent.dim,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      borderWidth: 2,
      borderColor: colors.accent.primary,
    },
    avatarLargeText: {
      ...typography.h2,
      color: colors.accent.primary,
      fontWeight: '700',
    },
    guestName: {
      ...typography.h2,
      color: colors.text.primary,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    companyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    companyText: {
      ...typography.caption,
      color: colors.accent.primary,
      fontWeight: '500',
    },
    contactRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    contactBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    contactBtnText: {
      ...typography.caption,
      color: colors.text.secondary,
    },

    // Stats
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    statValue: {
      ...typography.bodyMedium,
      color: colors.text.primary,
      fontWeight: '700',
      marginBottom: 2,
    },
    statLabel: {
      ...typography.label,
      color: colors.text.tertiary,
      textAlign: 'center',
    },

    // Card
    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    cardLabel: {
      ...typography.caption,
      color: colors.text.tertiary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.md,
    },

    // Stars
    starsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    ratingHint: {
      ...typography.caption,
      color: colors.accent.primary,
      marginTop: spacing.sm,
      fontWeight: '600',
    },

    // RM
    rmRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    rmAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.bg.base,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    rmInfo: {
      flex: 1,
    },
    rmName: {
      ...typography.bodyMedium,
      color: colors.text.primary,
      fontWeight: '600',
    },
    rmRole: {
      ...typography.caption,
      color: colors.text.tertiary,
    },
    rmCallBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent.dim,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Trip History
    sectionTitle: {
      ...typography.h3,
      color: colors.text.primary,
      fontWeight: '700',
      marginBottom: spacing.md,
    },
    tripCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    tripHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    tripTitle: {
      ...typography.bodyMedium,
      color: colors.text.primary,
      fontWeight: '600',
      flex: 1,
      marginRight: spacing.sm,
    },
    tripStatusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    tripStatusText: {
      ...typography.label,
      fontWeight: '700',
    },
    tripRoute: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    tripRouteText: {
      ...typography.caption,
      color: colors.text.secondary,
      flex: 1,
    },
    tripFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tripDate: {
      ...typography.caption,
      color: colors.text.tertiary,
    },
    tripAmount: {
      ...typography.bodyMedium,
      color: colors.accent.primary,
      fontWeight: '700',
    },

    // Empty
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    emptyText: {
      ...typography.body,
      color: colors.text.tertiary,
    },
  });
