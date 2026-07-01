import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius } from '../theme/colors';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  id: string;
  title: string;
  icon: IconName;
  iconFocused: IconName;
}

const tabs: TabConfig[] = [
  { id: 'dashboard', title: 'Dashboard', icon: 'grid-outline', iconFocused: 'grid' },
  { id: 'trips', title: 'Trips', icon: 'car-outline', iconFocused: 'car' },
  { id: 'calendar', title: 'Calendar', icon: 'calendar-outline', iconFocused: 'calendar' },
  { id: 'more', title: 'More', icon: 'ellipsis-horizontal-outline', iconFocused: 'ellipsis-horizontal' },
];

interface TabBarProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

export default function TabBar({ activeTab, onTabPress }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const pillShadow = {
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.4 : 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  };

  const fabShadow = {
    shadowColor: colors.accent.primary,
    shadowOpacity: isDark ? 0.5 : 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  };

  return (
    <View style={[styles.wrapper, { bottom: (insets.bottom || 0) + 48 }]}>
      {/* FAB (Booking) */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent.primary }, fabShadow]}
        onPress={() => onTabPress('booking')}
      >
        <Ionicons name="add" size={28} color={colors.text.inverse} />
      </Pressable>

      {/* Pill Tab Bar */}
      <View style={[styles.pill, { backgroundColor: colors.bg.elevated }, pillShadow]}>
        {tabs.map((tab) => {
          const focused = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[
                styles.tabItem,
                focused && { backgroundColor: colors.bg.overlay, borderRadius: radius.lg },
              ]}
              onPress={() => onTabPress(tab.id)}
            >
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={22}
                color={focused ? colors.accent.primary : colors.text.tertiary}
              />
              {focused && (
                <Text style={[styles.tabLabel, { color: colors.accent.primary }]}>
                  {tab.title}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  pill: {
    flexDirection: 'row',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    borderRadius: radius.lg,
    minWidth: 48,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  fab: {
    position: 'absolute',
    bottom: 64,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
