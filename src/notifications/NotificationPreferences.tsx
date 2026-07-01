/**
 * NotificationPreferences — Settings screen for push notification preferences
 *
 * Toggle individual notification types, sound, vibration, badge.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, typography } from '../theme/colors';
import { notificationService, NotificationPreferences as Prefs } from './notificationService';
import { toast } from '../utils/toast';
import { hapticTap } from '../utils/haptics';
import GlassCard from '../components/common/GlassCard';

interface PrefRowProps {
  icon: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: (val: boolean) => void;
  accentColor: string;
  isDark: boolean;
  colors: any;
  delay?: number;
}

function PrefRow({
  icon, label, description, value, onToggle, accentColor, isDark, colors, delay = 0,
}: PrefRowProps) {
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(delay).springify()}>
      <View style={[styles.prefRow, { borderBottomColor: colors.border.subtle }]}>
        <View style={[styles.prefIcon, { backgroundColor: accentColor + '15' }]}>
          <Ionicons name={icon as any} size={18} color={accentColor} />
        </View>
        <View style={styles.prefContent}>
          <Text style={[styles.prefLabel, { color: colors.text.primary }]}>{label}</Text>
          <Text style={[styles.prefDescription, { color: colors.text.tertiary }]}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={(val) => { hapticTap(); onToggle(val); }}
          trackColor={{ false: isDark ? '#2A2A2A' : '#E8E8E8', true: accentColor + '40' }}
          thumbColor={value ? accentColor : isDark ? '#666' : '#A3A3A3'}
        />
      </View>
    </Animated.View>
  );
}

export default function NotificationPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [prefs, setPrefs] = useState<Prefs>(notificationService.getPreferences());
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    // Check if permissions are granted
    notificationService.requestPermissions().then((granted) => {
      setHasPermission(granted);
    });
  }, []);

  const updatePref = useCallback(async (key: keyof Prefs, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    await notificationService.updatePreferences({ [key]: value });
    toast.success(`${value ? 'Enabled' : 'Disabled'}`);
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Ionicons name="notifications" size={22} color={colors.accent.primary} />
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Notifications
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission warning */}
        {!hasPermission && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Pressable
              style={[styles.permissionCard, { backgroundColor: colors.semantic.warning + '15', borderColor: colors.semantic.warning + '30' }]}
              onPress={async () => {
                const granted = await notificationService.requestPermissions();
                setHasPermission(granted);
                if (granted) toast.success('Notifications enabled');
              }}
            >
              <Ionicons name="warning-outline" size={20} color={colors.semantic.warning} />
              <View style={styles.permissionContent}>
                <Text style={[styles.permissionTitle, { color: colors.semantic.warning }]}>
                  Notifications Disabled
                </Text>
                <Text style={[styles.permissionText, { color: colors.text.tertiary }]}>
                  Tap to enable notifications in system settings
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
            </Pressable>
          </Animated.View>
        )}

        {/* Notification Types */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
            NOTIFICATION TYPES
          </Text>
        </Animated.View>

        <GlassCard variant="default" style={styles.card}>
          <PrefRow
            icon="car"
            label="New Bookings"
            description="When a new trip is booked"
            value={prefs.newBooking}
            onToggle={(v) => updatePref('newBooking', v)}
            accentColor={colors.semantic.info}
            isDark={isDark}
            colors={colors}
            delay={150}
          />
          <PrefRow
            icon="navigate"
            label="Trip Status"
            description="Trip confirmations, completions, cancellations"
            value={prefs.tripStatus}
            onToggle={(v) => updatePref('tripStatus', v)}
            accentColor={colors.semantic.success}
            isDark={isDark}
            colors={colors}
            delay={200}
          />
          <PrefRow
            icon="wallet"
            label="Payments"
            description="When payments are received"
            value={prefs.paymentReceived}
            onToggle={(v) => updatePref('paymentReceived', v)}
            accentColor="#FBBF24"
            isDark={isDark}
            colors={colors}
            delay={250}
          />
          <PrefRow
            icon="alarm"
            label="Trip Reminders"
            description="30 minutes before scheduled trips"
            value={prefs.tripReminder}
            onToggle={(v) => updatePref('tripReminder', v)}
            accentColor="#A78BFA"
            isDark={isDark}
            colors={colors}
            delay={300}
          />
          <PrefRow
            icon="megaphone"
            label="General"
            description="Updates, announcements, and tips"
            value={prefs.general}
            onToggle={(v) => updatePref('general', v)}
            accentColor={colors.accent.primary}
            isDark={isDark}
            colors={colors}
            delay={350}
          />
        </GlassCard>

        {/* Delivery Settings */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
          <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
            DELIVERY
          </Text>
        </Animated.View>

        <GlassCard variant="default" style={styles.card}>
          <PrefRow
            icon="volume-high"
            label="Sound"
            description="Play sound for notifications"
            value={prefs.sound}
            onToggle={(v) => updatePref('sound', v)}
            accentColor="#60A5FA"
            isDark={isDark}
            colors={colors}
            delay={450}
          />
          <PrefRow
            icon="phone-portrait"
            label="Vibration"
            description="Vibrate on notification"
            value={prefs.vibration}
            onToggle={(v) => updatePref('vibration', v)}
            accentColor="#F472B6"
            isDark={isDark}
            colors={colors}
            delay={500}
          />
          <PrefRow
            icon="ellipse"
            label="Badge"
            description="Show notification count on app icon"
            value={prefs.badge}
            onToggle={(v) => updatePref('badge', v)}
            accentColor="#34D399"
            isDark={isDark}
            colors={colors}
            delay={550}
          />
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  content: { padding: spacing.lg },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  prefIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  prefLabel: {
    ...typography.bodyMedium,
    fontSize: 14,
  },
  prefDescription: {
    ...typography.caption,
    marginTop: 1,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    ...typography.bodyMedium,
    fontSize: 14,
  },
  permissionText: {
    ...typography.caption,
    marginTop: 2,
  },
});
