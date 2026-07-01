import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { toast } from '../src/utils/toast';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { spacing, radius, typography, type Colors } from '../src/theme/colors';
import { useTheme } from '../src/context/ThemeContext';
import { formatCurrency } from '../src/data/placeholder';

// Mock invoice data
const invoiceData = {
  invoiceNumber: 'INV-2026-0614',
  date: 'June 14, 2026',
  dueDate: 'June 28, 2026',
  guest: {
    name: 'Priya Sharma',
    phone: '9988776655',
    email: 'priya.sharma@email.com',
    company: 'TechCorp India',
  },
  trip: {
    id: '2',
    from: 'IGI Airport T3',
    to: 'Connaught Place',
    date: '2026-06-14',
    vehicle: 'Toyota Innova',
    driver: 'Amit Singh',
  },
  lineItems: [
    { label: 'Base Fare', amount: 1200 },
    { label: 'Distance (22 km × ₹60/km)', amount: 1320 },
    { label: 'Duration (45m)', amount: 0 },
    { label: 'Tolls', amount: 180 },
    { label: 'Parking', amount: 100 },
    { label: 'Night Charges', amount: 0 },
  ],
  subtotal: 2800,
  gstPercent: 5,
  gstAmount: 140,
  grandTotal: 2940,
};

export default function InvoicePreviewScreen() {
  const { colors, isDark, shadows } = useTheme();
  const styles = getStyles(colors, isDark, shadows);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleDownload = () => {
    toast.info('Invoice PDF will be downloaded to your device.', 'Download PDF');
  };

  const handleShare = () => {
    toast.info('Share invoice via WhatsApp, Email, or other apps.', 'Share Invoice');
  };

  const handleSendEmail = () => {
    toast.success('Invoice sent successfully.', 'Sent');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Invoice Preview</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Invoice Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.invoiceHeaderCard}>
          <View style={styles.invoiceTitleRow}>
            <Ionicons name="document-text-outline" size={28} color={colors.accent.primary} />
            <Text style={styles.invoiceTitle}>INVOICE</Text>
          </View>
          <View style={styles.invoiceMetaRow}>
            <View>
              <Text style={styles.metaLabel}>Invoice No.</Text>
              <Text style={styles.metaValue}>{invoiceData.invoiceNumber}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{invoiceData.date}</Text>
            </View>
          </View>
          <View style={styles.dueRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.dueText}>Due: {invoiceData.dueDate}</Text>
          </View>
        </Animated.View>

        {/* Guest Info */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.card}>
          <Text style={styles.cardLabel}>Bill To</Text>
          <View style={styles.guestRow}>
            <View style={styles.guestAvatar}>
              <Ionicons name="person-outline" size={22} color={colors.text.secondary} />
            </View>
            <View style={styles.guestInfo}>
              <Text style={styles.guestName}>{invoiceData.guest.name}</Text>
              {invoiceData.guest.company && (
                <Text style={styles.guestCompany}>{invoiceData.guest.company}</Text>
              )}
              <Text style={styles.guestContact}>{invoiceData.guest.phone}</Text>
              {invoiceData.guest.email && (
                <Text style={styles.guestContact}>{invoiceData.guest.email}</Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Trip Details */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.card}>
          <Text style={styles.cardLabel}>Trip Details</Text>
          <View style={styles.tripInfoRow}>
            <View style={styles.routeDot} />
            <Text style={styles.tripInfoText}>{invoiceData.trip.from}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.tripInfoRow}>
            <View style={[styles.routeDot, { backgroundColor: colors.semantic.error }]} />
            <Text style={styles.tripInfoText}>{invoiceData.trip.to}</Text>
          </View>
          <View style={styles.tripMetaRow}>
            <View style={styles.tripMetaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.tripMetaText}>{invoiceData.trip.date}</Text>
            </View>
            <View style={styles.tripMetaItem}>
              <Ionicons name="car-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.tripMetaText}>{invoiceData.trip.vehicle}</Text>
            </View>
            <View style={styles.tripMetaItem}>
              <Ionicons name="person-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.tripMetaText}>{invoiceData.trip.driver}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Line Items */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.card}>
          <Text style={styles.cardLabel}>Charges</Text>
          {invoiceData.lineItems.map((item, index) => (
            <View key={index} style={styles.lineItem}>
              <Text style={styles.lineItemLabel}>{item.label}</Text>
              <Text style={styles.lineItemAmount}>
                {item.amount > 0 ? formatCurrency(item.amount) : '—'}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.lineItem}>
            <Text style={styles.lineItemLabel}>Subtotal</Text>
            <Text style={styles.lineItemAmount}>{formatCurrency(invoiceData.subtotal)}</Text>
          </View>
          <View style={styles.lineItem}>
            <Text style={styles.lineItemLabel}>GST ({invoiceData.gstPercent}%)</Text>
            <Text style={styles.lineItemAmount}>{formatCurrency(invoiceData.gstAmount)}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.accent.primary }]} />

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoiceData.grandTotal)}</Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.actionsContainer}>
          <Pressable style={[styles.actionBtn, styles.downloadBtn]} onPress={handleDownload}>
            <Ionicons name="download-outline" size={20} color={colors.text.inverse} />
            <Text style={styles.downloadBtnText}>Download PDF</Text>
          </Pressable>

          <View style={styles.secondaryActions}>
            <Pressable style={styles.secondaryBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={colors.accent.primary} />
              <Text style={styles.secondaryBtnText}>Share</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={handleSendEmail}>
              <Ionicons name="mail-outline" size={20} color={colors.accent.primary} />
              <Text style={styles.secondaryBtnText}>Send Email</Text>
            </Pressable>
          </View>
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

    // Invoice Header
    invoiceHeaderCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    invoiceTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    invoiceTitle: {
      ...typography.h1,
      color: colors.accent.primary,
      letterSpacing: 2,
    },
    invoiceMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    metaLabel: {
      ...typography.caption,
      color: colors.text.tertiary,
      marginBottom: 2,
    },
    metaValue: {
      ...typography.bodyMedium,
      color: colors.text.primary,
      fontWeight: '600',
    },
    dueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    dueText: {
      ...typography.caption,
      color: colors.text.tertiary,
    },

    // Cards
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

    // Guest
    guestRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    guestAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.bg.base,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    guestInfo: {
      flex: 1,
      gap: 2,
    },
    guestName: {
      ...typography.bodyMedium,
      color: colors.text.primary,
      fontWeight: '600',
    },
    guestCompany: {
      ...typography.caption,
      color: colors.accent.primary,
    },
    guestContact: {
      ...typography.caption,
      color: colors.text.secondary,
    },

    // Trip
    tripInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    routeDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.semantic.success,
    },
    routeLine: {
      width: 2,
      height: 24,
      backgroundColor: colors.border.default,
      marginLeft: 4,
      marginVertical: 2,
    },
    tripInfoText: {
      ...typography.bodyMedium,
      color: colors.text.primary,
    },
    tripMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    tripMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    tripMetaText: {
      ...typography.caption,
      color: colors.text.secondary,
    },

    // Line Items
    lineItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    lineItemLabel: {
      ...typography.body,
      color: colors.text.secondary,
      flex: 1,
    },
    lineItemAmount: {
      ...typography.bodyMedium,
      color: colors.text.primary,
      fontWeight: '500',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.subtle,
      marginVertical: spacing.sm,
    },
    grandTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    grandTotalLabel: {
      ...typography.h3,
      color: colors.text.primary,
      fontWeight: '700',
    },
    grandTotalValue: {
      ...typography.h2,
      color: colors.accent.primary,
      fontWeight: '700',
    },

    // Actions
    actionsContainer: {
      marginTop: spacing.md,
      gap: spacing.md,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.lg,
      borderRadius: radius.lg,
    },
    downloadBtn: {
      backgroundColor: colors.accent.primary,
    },
    downloadBtnText: {
      ...typography.bodyMedium,
      color: colors.text.inverse,
      fontWeight: '700',
    },
    secondaryActions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    secondaryBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
      backgroundColor: colors.bg.surface,
    },
    secondaryBtnText: {
      ...typography.bodyMedium,
      color: colors.accent.primary,
      fontWeight: '600',
    },
  });
