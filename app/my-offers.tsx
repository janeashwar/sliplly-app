import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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

const CAB_TYPES = ['Sedan', 'Hatchback', 'SUV', 'Tempo Traveller'];

export default function MyOffersScreen() {
  const { colors, isDark, shadows } = useTheme();
  const styles = getStyles(colors, isDark, shadows);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState<'All' | OfferStatus>('All');
  const [offers, setOffers] = useState<MyOffer[]>(MOCK_MY_OFFERS);

  // Create-offer sheet state
  const [showCreate, setShowCreate] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    from: '',
    to: '',
    date: '',
    price: '',
    seats: '4',
    cabType: 'Sedan',
    description: '',
  });

  const openCreate = () => {
    setForm({ from: '', to: '', date: '', price: '', seats: '4', cabType: 'Sedan', description: '' });
    setFormError(null);
    setShowCreate(true);
  };

  const submitCreate = () => {
    if (!form.from.trim() || !form.to.trim()) {
      setFormError('Pickup and drop locations are required.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date.trim())) {
      setFormError('Enter the date as YYYY-MM-DD.');
      return;
    }
    const priceNum = Number(form.price);
    if (!form.price.trim() || Number.isNaN(priceNum) || priceNum <= 0) {
      setFormError('Enter a valid price.');
      return;
    }
    const seatsNum = Math.max(1, Math.min(50, Number(form.seats) || 4));
    setOffers((prev) => [
      {
        id: `local-${Date.now()}`,
        from: form.from.trim(),
        to: form.to.trim(),
        date: form.date.trim(),
        price: priceNum,
        seats: seatsNum,
        cabType: form.cabType,
        description: form.description.trim() || `${form.cabType} trip from ${form.from.trim()} to ${form.to.trim()}.`,
        status: 'Active' as OfferStatus,
      },
      ...prev,
    ]);
    setShowCreate(false);
    toast.success('Your offer is now live.', 'Offer Created');
  };

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
          onPress={openCreate}
        >
          <Ionicons name="add-outline" size={28} color={colors.text.inverse} />
        </Pressable>
      </Animated.View>

      {/* Create Offer Sheet */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCreate(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Post an Offer</Text>
            <Text style={styles.modalSubtitle}>Publish a route for partners to claim.</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Pickup</Text>
                <TextInput
                  style={styles.input}
                  value={form.from}
                  onChangeText={(v) => setForm((f) => ({ ...f, from: v }))}
                  placeholder="IGI Airport T3"
                  placeholderTextColor={colors.text.tertiary}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Drop</Text>
                <TextInput
                  style={styles.input}
                  value={form.to}
                  onChangeText={(v) => setForm((f) => ({ ...f, to: v }))}
                  placeholder="Gurgaon Cyber Hub"
                  placeholderTextColor={colors.text.tertiary}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <TextInput
                    style={styles.input}
                    value={form.date}
                    onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
                    placeholder="2026-08-30"
                    placeholderTextColor={colors.text.tertiary}
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Price (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={form.price}
                    onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
                    placeholder="1600"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Seats</Text>
                <TextInput
                  style={styles.input}
                  value={form.seats}
                  onChangeText={(v) => setForm((f) => ({ ...f, seats: v.replace(/[^0-9]/g, '') }))}
                  placeholder="4"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="number-pad"
                />
              </View>

              <Text style={styles.fieldLabel}>Cab type</Text>
              <View style={styles.cabRow}>
                {CAB_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setForm((f) => ({ ...f, cabType: type }))}
                    style={[styles.cabChip, form.cabType === type && styles.cabChipActive]}
                  >
                    <Text style={[styles.cabChipText, form.cabType === type && styles.cabChipTextActive]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  placeholder="Airport pickup for corporate client..."
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {formError && <Text style={styles.formError}>{formError}</Text>}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnSecondary]} onPress={() => setShowCreate(false)}>
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={submitCreate}>
                <Text style={styles.modalBtnPrimaryText}>Post Offer</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

    // ── Create Offer Sheet ──
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalCard: {
      backgroundColor: colors.bg.base,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xxl,
      maxHeight: '85%',
    },
    modalHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border.default,
      marginBottom: spacing.md,
    },
    modalTitle: { ...typography.h3, color: colors.text.primary, fontWeight: '700' },
    modalSubtitle: { ...typography.caption, color: colors.text.secondary, marginTop: 4, marginBottom: spacing.lg },
    formRow: { flexDirection: 'row', gap: spacing.md },
    formField: { flex: 1, marginBottom: spacing.md },
    fieldLabel: { ...typography.caption, color: colors.text.secondary, fontWeight: '600', marginBottom: 6 },
    input: {
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      ...typography.body,
      color: colors.text.primary,
    },
    notesInput: { minHeight: 72, paddingTop: spacing.md },
    cabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 6, marginBottom: spacing.sm },
    cabChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.bg.surface,
    },
    cabChipActive: { borderColor: colors.accent.primary, backgroundColor: colors.accent.dim },
    cabChipText: { ...typography.caption, color: colors.text.secondary, fontWeight: '600' },
    cabChipTextActive: { color: colors.accent.primary },
    formError: {
      ...typography.caption,
      color: colors.semantic.error,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    modalBtn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    modalBtnPrimary: { backgroundColor: colors.accent.primary },
    modalBtnPrimaryText: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '700' },
    modalBtnSecondary: {
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    modalBtnSecondaryText: { ...typography.bodyMedium, color: colors.text.secondary, fontWeight: '600' },
  });
