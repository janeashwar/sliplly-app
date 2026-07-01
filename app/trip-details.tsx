import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, Linking, ActivityIndicator } from 'react-native';
import { toast } from '../src/utils/toast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useEffect, useState, useCallback } from 'react';
import { spacing, radius, typography, type Colors } from '../src/theme/colors';
import { hapticMedium, hapticLight } from '../src/utils/haptics';
import { useTheme } from '../src/context/ThemeContext';
import { formatCurrency, Trip } from '../src/data/placeholder';
import tripsApi, { Trip as ApiTrip } from '../src/api/trips';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Hero Transition Config ───
const HERO_SPRING = { stiffness: 280, damping: 26, mass: 1 };
const CARD_RADIUS = 14; // Match the trip card border radius (radius.lg)

export default function TripDetailsScreen() {
  const { colors, statusBadges, shadows, isDark } = useTheme();
  const styles = getStyles(colors, isDark, shadows);
  const { tripId, originX, originY, originW, originH } = useLocalSearchParams<{
    tripId: string;
    originX?: string;
    originY?: string;
    originW?: string;
    originH?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) { setLoading(false); return; }
      try {
        const data = await tripsApi.get(tripId);
        setTrip(data as unknown as Trip);
      } catch (err) {
        console.error('Failed to fetch trip details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [tripId]);

  // ─── Hero Transition: card expands from grid position to full screen ───
  // Parse origin position (where the card is on screen)
  const hasOrigin = originX !== undefined && originY !== undefined && originW !== undefined && originH !== undefined;
  const startX = hasOrigin ? parseFloat(originX!) : 0;
  const startY = hasOrigin ? parseFloat(originY!) : 0;
  const startW = hasOrigin ? parseFloat(originW!) : SCREEN_WIDTH;
  const startH = hasOrigin ? parseFloat(originH!) : SCREEN_HEIGHT;

  // Animation progress: 0 = at card position, 1 = full screen
  const progress = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate: card position → full screen
    progress.value = withSpring(1, HERO_SPRING);
    // Content fades in after card starts expanding
    contentOpacity.value = withDelay(250, withTiming(1, { duration: 300 }));
  }, []);

  // ─── Card morphs from grid position to full screen ───
  const heroStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;

    // Position: card origin → screen origin (0, 0)
    const x = startX * (1 - p);
    const y = startY * (1 - p);

    // Size: card size → screen size
    const w = startW + (SCREEN_WIDTH - startW) * p;
    const h = startH + (SCREEN_HEIGHT - startH) * p;

    // Border radius: card radius → 0
    const r = CARD_RADIUS * (1 - p);

    return {
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: r,
      overflow: 'hidden',
    };
  });

  // ─── Background dim overlay ───
  const bgStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.85,
  }));

  // ─── Content fades in after card settles ───
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="arrow-back-outline" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Trip Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[typography.body, { color: colors.text.tertiary, marginTop: spacing.md }]}>Loading trip...</Text>
        </View>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="arrow-back-outline" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Trip Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>Trip not found</Text>
        </View>
      </View>
    );
  }

  const tripStatus = trip.status || trip.tripStatus || 'INITIATED';
  const statusMap: Record<string, string> = {
    INITIATED: 'pending',
    ASSIGNED: 'inProgress',
    ON_DUTY: 'inProgress',
    COMPLETED: 'confirmed',
    FINALIZE_CHARGES: 'confirmed',
    CANCELLED: 'cancelled',
  };
  const statusKey = statusMap[tripStatus] || 'pending';
  const tripStatusBadge = (statusBadges as any)[statusKey] || statusBadges.pending;
  const statusLabels: Record<string, string> = {
    INITIATED: 'Initiated',
    ASSIGNED: 'Assigned',
    ON_DUTY: 'On Duty',
    COMPLETED: 'Completed',
    FINALIZE_CHARGES: 'Finalize',
    CANCELLED: 'Cancelled',
  };
  const statusLabel = statusLabels[tripStatus] || tripStatus;

  function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
    return (
      <View style={styles.infoRow}>
        <Ionicons name={icon} size={18} color={colors.text.tertiary} />
        <View style={styles.infoTexts}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Dimming background */}
      <Animated.View style={[styles.dimBg, bgStyle]} />

      {/* Hero card that morphs from grid position to full screen */}
      <Animated.View style={[styles.heroCard, heroStyle]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="arrow-back-outline" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Trip Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content fades in after card settles */}
        <Animated.View style={[styles.contentWrap, contentStyle]}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Status + Amount */}
            <View style={styles.topRow}>
              <View style={[styles.statusBadge, { backgroundColor: tripStatusBadge.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: tripStatusBadge.text }]} />
                <Text style={[styles.statusText, { color: tripStatusBadge.text }]}>{statusLabel}</Text>
              </View>
              <Text style={styles.amount}>{formatCurrency(trip.amount || trip.totalAmount || 0)}</Text>
            </View>

            {/* Trip Title */}
            <Text style={styles.tripTitle}>{trip.title || `Trip #${trip.tripCode || trip.id}`}</Text>

            {/* Route Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Route</Text>
              <View style={styles.routeContainer}>
                <View style={styles.routeDots}>
                  <View style={[styles.routeDot, { backgroundColor: colors.semantic.success }]} />
                  <View style={styles.routeLine} />
                  <View style={[styles.routeDot, { backgroundColor: colors.semantic.error }]} />
                </View>
                <View style={styles.routeTexts}>
                  <View style={styles.routePoint}>
                    <Text style={styles.routeLabel}>Pickup</Text>
                    <Text style={styles.routeValue}>{trip.from || trip.pickupLocation || '—'}</Text>
                  </View>
                  <View style={styles.routePoint}>
                    <Text style={styles.routeLabel}>Drop-off</Text>
                    <Text style={styles.routeValue}>{trip.to || trip.dropLocation || '—'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Trip Info Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Trip Information</Text>
              <View style={styles.infoGrid}>
                <InfoRow icon="navigate" label="Distance" value={trip.distance || (trip.totalKm ? `${trip.totalKm} km` : '—')} />
                <InfoRow icon="time" label="Duration" value={trip.duration || '—'} />
                <InfoRow icon="car" label="Vehicle" value={trip.vehicle || (typeof trip.assignedVehicle === 'object' ? (trip.assignedVehicle as any).name : trip.assignedVehicle) || '—'} />
                <InfoRow icon="calendar" label="Date" value={trip.date || trip.startDate || trip.pickupDatetime?.split('T')[0] || '—'} />
                <InfoRow icon="alarm" label="Time" value={trip.time || trip.pickupDatetime?.split('T')[1]?.substring(0, 5) || '—'} />
              </View>
            </View>

            {/* Guest Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Guest Details</Text>
              <View style={styles.personRow}>
                <View style={styles.personAvatar}>
                  <Ionicons name="person-outline" size={24} color={colors.text.secondary} />
                </View>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{trip.guestName || '—'}</Text>
                  <Text style={styles.personPhone}>{trip.phone || trip.guestPhone || trip.guestContact || ''}</Text>
                </View>
                <View style={styles.actionButtons}>
                  <Pressable style={styles.callBtn} onPress={() => {
                    hapticMedium();
                    const phone = trip.phone || trip.guestPhone || trip.guestContact;
                    if (phone) {
                      Linking.openURL(`tel:${phone}`);
                    } else {
                      toast.warning('No phone number available for this guest.', 'No Phone Number');
                    }
                  }}>
                    <Ionicons name="call-outline" size={20} color={colors.accent.primary} />
                  </Pressable>
                  <Pressable style={styles.whatsappBtn} onPress={() => {
                    hapticMedium();
                    const phone = trip.phone || trip.guestPhone || trip.guestContact;
                    const from = trip.from || trip.pickupLocation || '';
                    const to = trip.to || trip.dropLocation || '';
                    if (phone) {
                      const message = `Hi ${trip.guestName}, your trip ${trip.id} from ${from} to ${to} has been confirmed.`;
                      const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
                      Linking.openURL(url).catch(() => {
                        toast.error('WhatsApp is not installed');
                      });
                    } else {
                      toast.warning('No phone number available for this guest.', 'No Phone Number');
                    }
                  }}>
                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Driver Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Driver</Text>
              <View style={styles.personRow}>
                <View style={styles.personAvatar}>
                  <Ionicons name="car-outline" size={24} color={colors.text.secondary} />
                </View>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{trip.driver || trip.driverName || (typeof trip.assignedDriver === 'object' ? (trip.assignedDriver as any).name : trip.assignedDriver) || 'Pending'}</Text>
                  <Text style={styles.personSub}>{trip.vehicle || (typeof trip.assignedVehicle === 'object' ? (trip.assignedVehicle as any).name : trip.assignedVehicle) || ''}</Text>
                </View>
              </View>
            </View>

            {/* Bottom spacing */}
            <View style={{ height: spacing.xxl }} />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </View>
  );
}



const getStyles = (colors: Colors, isDark: boolean, shadows: any) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  dimBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },

  heroCard: {
    backgroundColor: colors.bg.base,
  },

  contentWrap: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg.base,
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

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  amount: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
  },

  tripTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },

  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
     ...(!isDark ? shadows.low : {}),
  },
  cardLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },

  routeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  routeDots: {
    alignItems: 'center',
    paddingTop: 4,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: colors.border.default,
    marginVertical: 4,
  },
  routeTexts: {
    flex: 1,
    gap: spacing.lg,
  },
  routePoint: {
    gap: 2,
  },
  routeLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  routeValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
  },

  infoGrid: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoTexts: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  infoValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
  },

  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  personPhone: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  personSub: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surface,
  },
  whatsappBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366' + '20',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.tertiary,
  },
});
