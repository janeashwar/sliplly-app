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
import { formatCurrency } from '../src/data/placeholder';

// ── Types ──
type OfferStatus = 'Active' | 'Expired' | 'Completed';

interface MyOffer {
  id: string;
  from: string;
  to: string;
  date: string;
  price: number;
  seats: number;
  cabType: string;
  description: string;
  status: OfferStatus;
  claimedBy?: string;
}

// ── Mock Data ──
const MOCK_MY_OFFERS: MyOffer[] = [
  {
    id: '1',
    from: 'IGI Airport T3',
    to: 'Gurgaon Cyber Hub',
    date: '2026-06-22',
    price: 1600,
    seats: 4,
    cabType: 'Sedan',
    description: 'Airport pickup for corporate client. Need experienced driver.',
    status: 'Active',
  },
  {
    id: '2',
    from: 'Andheri West',
    to: 'BKC',
    date: '2026-06-21',
    price: 800,
    seats: 4,
    cabType: 'Hatchback',
    description: 'Morning office commute. Daily recurring.',
    status: 'Active',
    claimedBy: 'Metro Cabs Pvt Ltd',
  },
  {
    id: '3',
    from: 'Koramangala',
    to: 'Whitefield',
    date: '2026-06-18',
    price: 1100,
    seats: 4,
    cabType: 'Sedan',
    description: 'Office drop. Dzire or similar.',
    status: 'Completed',
    claimedBy: 'CityLink Travels',
  },
  {
    id: '4',
    from: 'Dwarka Sec 21',
    to: 'Noida Sec 62',
    date: '2026-06-15',
    price: 2200,
    seats: 6,
    cabType: 'SUV',
    description: 'Group trip for team outing.',
    status: 'Expired',
  },
];

const STATUS_COLORS: Record<OfferStatus, { bg: string; text: string }> = {
  Active: { bg: '#34D39918', text: '#34D399' },
  Expired: { bg: '#EF444418', text: '#EF4444' },
  Completed: { bg: '#60A5FA18', text: '#60A5FA' },
};

const STATUS_FILTERS: ('All' | OfferStatus)[] = ['All', 'Active', 'Expired', 'Completed'];

export default function MyOffersScreen() {
  const { colors, isDark, shadows } = useTheme();
  const styles = getStyles(colors, isDark, shadows);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState<'All' | OfferStatus>('All');
  const [offers, setOffers] = useState<MyOffer[]>(MOCK_MY_OFFERS);

  const filtered = activeFilter === 'All'
    ? offers
    : offers.filter((o) => o.status === activeFilter);

  const handleCancel = (offer: MyOffer) => {
    Alert.alert(
      'Cancel Offer',
      `Cancel your offer from ${offer.from} to ${offer.to}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Offer',
          style: 'destructive',
          onPress: () => {
            setOffers((prev) =>
              prev.map((o) => (o.id === offer.id ? { ...o, status: 'Expired' as OfferStatus } : o))
            );
          },
        },
      ],
    );
  };

  const handleComplete = (offer: MyOffer) => {
    Alert.alert(
      'Mark Complete',
      `Mark this offer as completed?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            setOffers((prev) =>
              prev.map((o) => (o.id === offer.id ? { ...o, status: 'Completed' as OfferStatus } : o))
            );
          },
        },
      ],
    );
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const renderOfferCard = (offer: MyOffer, index: number) => {
    const sc = STATUS_COLORS[offer.status];
    return (
      <Animated.View
        key={offer.id}
        entering={FadeInDown.delay(150 + index * 80).duration(400)}
        style={styles.card}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{offer.status}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(offer.date)}</Text>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.routeDot} />
          <Text style={styles.routeText} numberOfLines={1}>{offer.from}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: colors.semantic.error }]} />
          <Text style={styles.routeText} numberOfLines={1}>{offer.to}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>{offer.description}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="car-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.metaText}>{offer.cabType}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="people-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.metaText}>{offer.seats}</Text>
          </View>
          <Text style={styles.priceText}>{formatCurrency(offer.price)}</Text>
        </View>

        {offer.claimedBy && (
          <View style={styles.claimedRow}>
            <Ionicons name="checkmark-circle-outline" size={14} color={colors.semantic.success} />
            <Text style={styles.claimedText}>Claimed by {offer.claimedBy}</Text>
          </View>
        )}

        {offer.status === 'Active' && (
          <View style={styles.actionRow}>
            <Pressable style={styles.completeBtn} onPress={() => handleComplete(offer)}>
              <Ionicons name="checkmark-done-outline" size={16} color={colors.semantic.success} />
              <Text style={[styles.actionBtnText, { color: colors.semantic.success }]}>Complete</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => handleCancel(offer)}>
              <Ionicons name="close-circle-outline" size={16} color={colors.semantic.error} />
              <Text style={[styles.actionBtnText, { color: colors.semantic.error }]}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Offers</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Filter Chips */}
      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setActiveFilter(item)}
              style={[
                styles.filterChip,
                activeFilter === item && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )}
        />
      </Animated.View>

      {/* Offers List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => renderOfferCard(item, index)}
        ListEmptyComponent={
          <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={56} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No offers found</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'All'
                ? 'Tap + to post your first offer'
                : `No ${activeFilter.toLowerCase()} offers`}
            </Text>
          </Animated.View>
        }
      />

      {/* FAB */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)} style={[styles.fab, { bottom: insets.bottom + 24 }]}>
        <Pressable
          style={styles.fabInner}
          onPress={() => toast.info('Create new offer form coming soon!', 'Create Offer')}
        >
          <Ionicons name="add-outline" size={28} color={colors.text.inverse} />
        </Pressable>
      </Animated.View>
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

    filterRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
    filterChip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    filterChipActive: {
      backgroundColor: colors.accent.primary,
      borderColor: colors.accent.primary,
    },
    filterChipText: { ...typography.caption, color: colors.text.secondary, fontWeight: '500' },
    filterChipTextActive: { color: colors.text.inverse },

    listContent: { padding: spacing.lg, paddingBottom: 100 },

    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    statusBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full },
    statusText: { ...typography.label, fontWeight: '700' },
    dateText: { ...typography.caption, color: colors.text.tertiary },

    routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    routeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.semantic.success },
    routeLine: { width: 1, height: 12, backgroundColor: colors.border.default, marginLeft: 4.5, marginVertical: 2 },
    routeText: { ...typography.bodyMedium, color: colors.text.primary, flex: 1 },

    description: { ...typography.caption, color: colors.text.secondary, marginTop: spacing.md, lineHeight: 18 },

    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.bg.overlay,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    metaText: { ...typography.caption, color: colors.text.secondary },
    priceText: { ...typography.bodyMedium, color: colors.accent.primary, fontWeight: '700', marginLeft: 'auto' },

    claimedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
    claimedText: { ...typography.caption, color: colors.semantic.success },

    actionRow: {
      flexDirection: 'row',
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    completeBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.semantic.success,
      backgroundColor: '#34D39910',
    },
    cancelBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.semantic.error,
      backgroundColor: '#EF444410',
    },
    actionBtnText: { ...typography.bodyMedium, fontWeight: '600' },

    emptyState: { alignItems: 'center', paddingTop: spacing.xxxxl * 2, gap: spacing.md },
    emptyTitle: { ...typography.h3, color: colors.text.primary },
    emptySubtitle: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },

    fab: { position: 'absolute', right: spacing.xl },
    fabInner: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
  });
