import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { spacing, radius, typography, type Colors } from '../src/theme/colors';
import { useTheme } from '../src/context/ThemeContext';
import PageLayout from '../src/components/PageLayout';
import { toast } from '../src/utils/toast';
import { hapticTap, hapticWarning, hapticSelection } from '../src/utils/haptics';

interface SettingItem {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  type: 'navigate' | 'toggle' | 'info';
  value?: string;
  toggleValue?: boolean;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

const SECTIONS: SettingSection[] = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Edit Profile', type: 'navigate' },
      { icon: 'lock-closed-outline', label: 'Change Password', type: 'navigate' },
      { icon: 'shield-checkmark-outline', label: 'Two-Factor Auth', type: 'navigate', value: 'Enabled' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'moon-outline', label: 'Dark Mode', type: 'toggle', toggleValue: true },
      { icon: 'language-outline', label: 'Language', type: 'navigate', value: 'English' },
      { icon: 'notifications-outline', label: 'Notification Preferences', type: 'navigate' },
      { icon: 'location-outline', label: 'Location Services', type: 'toggle', toggleValue: true },
    ],
  },
  {
    title: 'Fleet',
    items: [
      { icon: 'car-outline', label: 'Default Vehicle Type', type: 'navigate', value: 'Sedan' },
      { icon: 'document-text-outline', label: 'Invoice Template', type: 'navigate', value: 'Standard' },
      { icon: 'cash-outline', label: 'Currency', type: 'info', value: 'INR (₹)' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help Center', type: 'navigate' },
      { icon: 'bug-outline', label: 'Report a Bug', type: 'navigate' },
      { icon: 'document-outline', label: 'Terms of Service', type: 'navigate' },
      { icon: 'lock-closed-outline', label: 'Privacy Policy', type: 'navigate' },
    ],
  },
  {
    title: 'About',
    items: [
      { icon: 'information-circle-outline', label: 'App Version', type: 'info', value: '2.4.1' },
      { icon: 'build-outline', label: 'Build Number', type: 'info', value: '2026.06.18' },
      { icon: 'globe-outline', label: 'Website', type: 'navigate', value: 'sliplly.com' },
    ],
  },
];

export default function SettingsScreen() {
  const { colors, statusBadges, shadows, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const styles = getStyles(colors, isDark, shadows);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    'Notifications': true,
    'Location Services': true,
  });

  const handleToggle = (label: string) => {
    hapticSelection();
    if (label === 'Dark Mode') {
      toggleTheme();
    } else {
      setToggles((prev) => ({ ...prev, [label]: !prev[label] }));
    }
  };

  return (
    <PageLayout title="Settings">
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((item, index) => (
              <Pressable
                key={item.label}
                style={[
                  styles.menuItem,
                  index < section.items.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => {
                   if (item.type === 'toggle') handleToggle(item.label);
                   if (item.type === 'navigate' && item.label === 'Two-Factor Auth') {
                     router.push('/two-factor-setup');
                   } else if (item.type === 'navigate' && item.label === 'Notification Preferences') {
                     router.push('/notification-preferences');
                     hapticTap();
                   } else if (item.type === 'navigate') {
                     toast.info('This setting will be available soon!', 'Coming Soon');
                     hapticTap();
                   }
                }}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconWrap}>
                    <Ionicons name={item.icon} size={20} color={colors.text.secondary} />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>

                <View style={styles.menuItemRight}>
                  {item.type === 'navigate' && item.value && (
                    <Text style={styles.menuItemValue}>{item.value}</Text>
                  )}
                  {item.type === 'navigate' && (
                    <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
                  )}
                  {item.type === 'toggle' && (
                    <Switch
                      value={item.label === 'Dark Mode' ? isDark : (toggles[item.label] ?? item.toggleValue ?? false)}
                      onValueChange={() => handleToggle(item.label)}
                      trackColor={{
                        false: colors.bg.overlay,
                        true: colors.accent.primary + '60',
                      }}
                      thumbColor={
                        (item.label === 'Dark Mode' ? isDark : (toggles[item.label] ?? item.toggleValue ?? false))
                          ? colors.accent.primary
                          : colors.text.tertiary
                      }
                    />
                  )}
                  {item.type === 'info' && (
                    <Text style={styles.menuItemInfo}>{item.value}</Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      {/* Logout */}
      <Pressable style={styles.logoutBtn} onPress={() => Alert.alert('Log Out', 'Are you sure you want to log out?', [{ text: 'Cancel', style: 'cancel' as const }, { text: 'Log Out', style: 'destructive' as const }])}>
        <Ionicons name="log-out-outline" size={22} color={colors.semantic.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>

      <View style={{ height: spacing.xl }} />
    </PageLayout>
  );
}

const getStyles = (colors: Colors, isDark: boolean, shadows: any) => StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
     ...(!isDark ? shadows.low : {}),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    ...typography.body,
    color: colors.text.primary,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuItemValue: {
    ...typography.body,
    color: colors.text.tertiary,
  },
  menuItemInfo: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.semantic.error + '10',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.semantic.error + '20',
  },
  logoutText: {
    ...typography.bodyMedium,
    color: colors.semantic.error,
    fontWeight: '600',
  },
});
