import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { spacing, radius, typography, type Colors } from '../src/theme/colors';
import { useTheme } from '../src/context/ThemeContext';
import { toast } from '../src/utils/toast';

// ── Types ──
type NotificationType = 'SMS' | 'Email';
type DeliveryStatus = 'idle' | 'sending' | 'sent' | 'failed';

interface MessageTemplate {
  id: string;
  name: string;
  body: string;
}

// ── Data ──
const TEMPLATES: MessageTemplate[] = [
  {
    id: '1',
    name: 'Trip Confirmation',
    body: 'Your trip from {from} to {to} on {date} has been confirmed. Driver: {driver}, Vehicle: {vehicle}. Thank you for choosing Sliplly!',
  },
  {
    id: '2',
    name: 'Driver Assigned',
    body: 'Hi {guest}, your driver {driver} ({phone}) has been assigned for your trip on {date}. Vehicle: {vehicle}. Have a safe journey!',
  },
  {
    id: '3',
    name: 'Trip Completed',
    body: 'Your trip from {from} to {to} has been completed. Total: {amount}. We hope you had a pleasant experience. Rate us in the app!',
  },
  {
    id: '4',
    name: 'Payment Reminder',
    body: 'Reminder: Payment of {amount} for your trip on {date} is pending. Please complete the payment at your earliest convenience.',
  },
  {
    id: '5',
    name: 'Custom',
    body: '',
  },
];

// Auto-filled trip context (mock)
const TRIP_CONTEXT = {
  guestName: 'Rajesh Kumar',
  phone: '+91 98765 43210',
  email: 'rajesh.kumar@example.com',
  from: 'IGI Airport T3',
  to: 'Connaught Place',
  date: '22 Jun 2026',
  driver: 'Amit Singh',
  vehicle: 'Swift Dzire (DL-01-AB-1234)',
  amount: '₹1,800',
};

export default function SendNotificationScreen() {
  const { colors, isDark, shadows } = useTheme();
  const styles = getStyles(colors, isDark, shadows);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [notifType, setNotifType] = useState<NotificationType>('SMS');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate>(TEMPLATES[0]);
  const [customMessage, setCustomMessage] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('idle');

  const resolvedMessage = selectedTemplate.id === '5'
    ? customMessage
    : selectedTemplate.body
        .replace('{guest}', TRIP_CONTEXT.guestName)
        .replace('{from}', TRIP_CONTEXT.from)
        .replace('{to}', TRIP_CONTEXT.to)
        .replace('{date}', TRIP_CONTEXT.date)
        .replace('{driver}', TRIP_CONTEXT.driver)
        .replace('{vehicle}', TRIP_CONTEXT.vehicle)
        .replace('{phone}', TRIP_CONTEXT.phone)
        .replace('{amount}', TRIP_CONTEXT.amount);

  const recipient = notifType === 'SMS' ? TRIP_CONTEXT.phone : TRIP_CONTEXT.email;

  const handleSend = () => {
    if (selectedTemplate.id === '5' && !customMessage.trim()) {
      toast.warning('Please enter a message to send.', 'Empty Message');
      return;
    }
    setDeliveryStatus('sending');
    setTimeout(() => {
      setDeliveryStatus('sent');
      toast.success('Notification sent successfully!', 'Sent');
      setTimeout(() => setDeliveryStatus('idle'), 3000);
    }, 1500);
  };

  const statusConfig: Record<DeliveryStatus, { icon: string; text: string; color: string; bg: string }> = {
    idle: { icon: '', text: '', color: '', bg: 'transparent' },
    sending: { icon: 'hourglass-outline', text: 'Sending...', color: colors.semantic.warning, bg: '#FBBF2418' },
    sent: { icon: 'checkmark-circle', text: `${notifType} sent successfully!`, color: colors.semantic.success, bg: '#34D39918' },
    failed: { icon: 'close-circle', text: `Failed to send ${notifType}`, color: colors.semantic.error, bg: '#EF444418' },
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Send Notification</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type Selector */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <Text style={styles.label}>Notification Type</Text>
          <View style={styles.typeRow}>
            {(['SMS', 'Email'] as NotificationType[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setNotifType(t)}
                style={[styles.typeBtn, notifType === t && styles.typeBtnActive]}
              >
                <Ionicons
                  name={t === 'SMS' ? 'chatbubble-outline' : 'mail-outline'}
                  size={20}
                  color={notifType === t ? colors.text.inverse : colors.text.secondary}
                />
                <Text style={[styles.typeBtnText, notifType === t && styles.typeBtnTextActive]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Recipient Info */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.section}>
          <Text style={styles.label}>Recipient</Text>
          <View style={styles.recipientCard}>
            <View style={styles.recipientRow}>
              <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.recipientName}>{TRIP_CONTEXT.guestName}</Text>
            </View>
            <View style={styles.recipientRow}>
              <Ionicons
                name={notifType === 'SMS' ? 'call-outline' : 'mail-outline'}
                size={16}
                color={colors.accent.primary}
              />
              <Text style={styles.recipientValue}>{recipient}</Text>
            </View>
            <View style={styles.recipientRow}>
              <Ionicons name="navigate-outline" size={16} color={colors.text.tertiary} />
              <Text style={styles.recipientMeta}>
                {TRIP_CONTEXT.from} → {TRIP_CONTEXT.to}
              </Text>
            </View>
            <View style={styles.recipientRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.text.tertiary} />
              <Text style={styles.recipientMeta}>{TRIP_CONTEXT.date}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Template Selector */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.section}>
          <Text style={styles.label}>Message Template</Text>
          <View style={styles.templateList}>
            {TEMPLATES.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setSelectedTemplate(t)}
                style={[
                  styles.templateChip,
                  selectedTemplate.id === t.id && styles.templateChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.templateChipText,
                    selectedTemplate.id === t.id && styles.templateChipTextActive,
                  ]}
                >
                  {t.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Message Preview / Custom Input */}
        <Animated.View entering={FadeInDown.delay(320).duration(400)} style={styles.section}>
          <Text style={styles.label}>
            {selectedTemplate.id === '5' ? 'Compose Message' : 'Message Preview'}
          </Text>
          {selectedTemplate.id === '5' ? (
            <TextInput
              style={styles.textInput}
              placeholder="Type your custom message..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              value={customMessage}
              onChangeText={setCustomMessage}
              textAlignVertical="top"
            />
          ) : (
            <View style={styles.previewCard}>
              <Text style={styles.previewText}>{resolvedMessage}</Text>
            </View>
          )}
          {selectedTemplate.id !== '5' && (
            <Text style={styles.charCount}>{resolvedMessage.length} characters</Text>
          )}
        </Animated.View>

        {/* Delivery Status */}
        {deliveryStatus !== 'idle' && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[styles.statusCard, { backgroundColor: statusConfig[deliveryStatus].bg }]}
          >
            <Ionicons
              name={statusConfig[deliveryStatus].icon as any}
              size={20}
              color={statusConfig[deliveryStatus].color}
            />
            <Text style={[styles.statusText, { color: statusConfig[deliveryStatus].color }]}>
              {statusConfig[deliveryStatus].text}
            </Text>
          </Animated.View>
        )}

        {/* Send Button */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <Pressable
            style={[
              styles.sendBtn,
              deliveryStatus === 'sending' && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={deliveryStatus === 'sending'}
          >
            <Ionicons
              name={deliveryStatus === 'sending' ? 'hourglass-outline' : 'send-outline'}
              size={20}
              color={colors.text.inverse}
            />
            <Text style={styles.sendBtnText}>
              {deliveryStatus === 'sending' ? 'Sending...' : `Send ${notifType}`}
            </Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
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

    content: { flex: 1 },
    contentContainer: { padding: spacing.lg },

    section: { marginTop: spacing.lg },
    label: { ...typography.caption, color: colors.text.secondary, fontWeight: '600', marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },

    typeRow: { flexDirection: 'row', gap: spacing.sm },
    typeBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    typeBtnActive: {
      backgroundColor: colors.accent.primary,
      borderColor: colors.accent.primary,
    },
    typeBtnText: { ...typography.bodyMedium, color: colors.text.secondary, fontWeight: '500' },
    typeBtnTextActive: { color: colors.text.inverse },

    recipientCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      gap: spacing.sm,
    },
    recipientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    recipientName: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },
    recipientValue: { ...typography.bodyMedium, color: colors.accent.primary, fontWeight: '500' },
    recipientMeta: { ...typography.caption, color: colors.text.tertiary },

    templateList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    templateChip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    templateChipActive: {
      backgroundColor: colors.accent.primary,
      borderColor: colors.accent.primary,
    },
    templateChipText: { ...typography.caption, color: colors.text.secondary, fontWeight: '500' },
    templateChipTextActive: { color: colors.text.inverse },

    previewCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    previewText: { ...typography.body, color: colors.text.primary, lineHeight: 22 },
    charCount: { ...typography.caption, color: colors.text.tertiary, marginTop: spacing.xs, textAlign: 'right' },

    textInput: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
      color: colors.text.primary,
      ...typography.body,
      minHeight: 120,
    },

    statusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      marginTop: spacing.lg,
    },
    statusText: { ...typography.bodyMedium, fontWeight: '600' },

    sendBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.accent.primary,
      marginTop: spacing.md,
    },
    sendBtnDisabled: { opacity: 0.5 },
    sendBtnText: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '700' },
  });
