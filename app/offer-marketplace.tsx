import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
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
interface MarketOffer {
  id: string;
  agency: string;
  from: string;
  to: string;
  date: string;
  price: number;
  seats: number;
  cabType: string;
  description: string;
}

// ── Mock Data ──
const MOCK_OFFERS: MarketOffer[] = [
  {
    id: '1',
    agency: 'Metro Cabs Pvt Ltd',
    from: 'IGI Airport T3',
    to: 'Connaught Place',
    date: '2026-06-22',
    price: 1800,
    seats: 4,
    cabType: 'Sedan',
    description: 'Airport pickup, AC sedan with experienced driver. Flight tracking included.',
  },
  {
    id: '2',
    agency: 'Royal Riders',
    from: 'Mumbai Central',
    to: 'Pune Station',
    date: '2026-06-23',
    price: 3500,
    seats: 6,
    cabType: 'SUV',
    description: 'Outstation trip, Innova Crysta. Toll and parking included.',
  },
  {
    id: '3',
    agency: 'CityLink Travels',
    from: 'Electronic City',
    to: 'Kempegowda Airport',
    date: '2026-06-22',
    price: 1200,
    seats: 4,
    cabType: 'Hatchback',
    description: 'Quick airport drop, Swift hatchback. No waiting charges.',
  },
  {
    id: '4',
    agency: 'GreenLine Cabs',
    from: 'T Nagar',
    to: 'Pondicherry',
    date: '2026-06-24',
    price: 4200,
    seats: 4,
    cabType: 'Sedan',
    description: 'Weekend getaway trip. Comfortable sedan with AC. Driver experienced on ECR route.',
  },
  {
    id: '5',
    agency: 'Swift Transports',
    from: 'Salt Lake Sector V',
    to: 'Howrah Station',
    date: '2026-06-22',
    price: 900,
    seats: 4,
    cabType: 'Hatchback',
    description: 'Station transfer. Quick and reliable. Luggage space available.',
  },
];

const CAB_FILTERS = ['All', 'Sedan', 'SUV', 'Hatchback'];

export default function OfferMarketplaceScreen() {
  const { colors, isDark, shadows } = useTheme();
  const styles = getStyles(colors, isDark, shadows);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeCabFilter, setActiveCabFilter] = useState('All');
  const [offers] = useState<MarketOffer[]>(MOCK_OFFERS);

  const filtered = activeCabFilter === 'All'
    ? offers
    : offers.filter((o) => o.cabType === activeCabFilter);

  const handleClaim = (offer: MarketOffer) => {
    toast.success('Offer claimed successfully!');
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderOfferCard = (offer: MarketOffer, index: number) => (
    <Animated.View
      key={offer.id}
      entering={FadeInDown.delay(150 + index * 80).duration(400)}
      style={styles.card}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.agencyBadge}>
          <Ionicons name="business-outline" size={13} color={colors.accent.primary} />
          <Text style={styles.agencyText} numberOfLines={1}>{offer.agency}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(offer.date)}</Text>
      </View>

      <View style={styles.routeRow}>
        <View style={styles.routeDot} />
        <Text style={styles.routeFrom} numberOfLines={1}>{offer.from}</Text>
      </View>
      <View style={styles.routeLine} />
      <View style={styles.routeRow}>
        <View style={[styles.routeDot, { backgroundColor: colors.semantic.error }]} />
        <Text style={styles.routeTo} numberOfLines={1}>{offer.to}</Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>{offer.description}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Ionicons name="car-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.metaText}>{offer.cabType}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="people-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.metaText}>{offer.seats} seats</Text>
        </View>
        <Text style={styles.priceText}>{formatCurrency(offer.price)}</Text>
      </View>

      <Pressable style={styles.claimBtn} onPress={() => handleClaim(offer)}>
        <Ionicons name="checkmark-circle-outline" size={18} color={colors.text.inverse} />
        <Text style={styles.claimBtnText}>Claim Offer</Text>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Offer Marketplace</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Filter Chips */}
      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {CAB_FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setActiveCabFilter(f)}
              style={[
                styles.filterChip,
                activeCabFilter === f && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeCabFilter === f && styles.filterChipTextActive,
                ]}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
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
            <Ionicons name="cube-outline" size={56} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No offers available</Text>
            <Text style={styles.emptySubtitle}>Check back later for new offers from partner agencies</Text>
          </Animated.View>
        }
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

    listContent: { padding: spacing.lg, paddingBottom: spacing.xxxxl },

    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    agencyBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    agencyText: { ...typography.caption, color: colors.accent.primary, fontWeight: '600' },
    dateText: { ...typography.caption, color: colors.text.tertiary },

    routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    routeDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.semantic.success,
    },
    routeLine: { width: 1, height: 12, backgroundColor: colors.border.default, marginLeft: 4.5, marginVertical: 2 },
    routeFrom: { ...typography.bodyMedium, color: colors.text.primary, flex: 1 },
    routeTo: { ...typography.bodyMedium, color: colors.text.primary, flex: 1 },

    description: { ...typography.caption, color: colors.text.secondary, marginTop: spacing.md, lineHeight: 18 },

    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.md,
      gap: spacing.sm,
    },
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

    claimBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.lg,
      backgroundColor: colors.accent.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
    },
    claimBtnText: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '600' },

    emptyState: { alignItems: 'center', paddingTop: spacing.xxxxl * 2, gap: spacing.md },
    emptyTitle: { ...typography.h3, color: colors.text.primary },
    emptySubtitle: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
  });
