/**
 * Memoized Components — React.memo wrappers for frequently re-rendering components
 *
 * These prevent unnecessary re-renders when parent state changes
 * but the component's props haven't changed.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius } from '../theme/colors';

// ── Memoized Status Badge ──
interface StatusBadgeProps {
  status: string;
  label: string;
  bg: string;
  text: string;
  ring: string;
}

export const MemoizedStatusBadge = React.memo<StatusBadgeProps>(
  ({ status, label, bg, text: textColor, ring }) => (
    <View style={[badgeStyles.container, { backgroundColor: bg, borderColor: ring }]}>
      <View style={[badgeStyles.dot, { backgroundColor: textColor }]} />
      <Text style={[badgeStyles.label, { color: textColor }]}>{label}</Text>
    </View>
  ),
  (prev, next) => prev.status === next.status && prev.label === next.label
);

const badgeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.badge,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...typography.label,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});

// ── Memoized Action Button ──
interface ActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
  bgColor: string;
}

export const MemoizedActionButton = React.memo<ActionButtonProps>(
  ({ icon, label, onPress, color, bgColor }) => (
    <Pressable style={[actionStyles.button, { backgroundColor: bgColor }]} onPress={onPress}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[actionStyles.label, { color }]}>{label}</Text>
    </Pressable>
  ),
  (prev, next) =>
    prev.icon === next.icon &&
    prev.label === next.label &&
    prev.color === next.color
);

const actionStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
});

// ── Memoized Info Row ──
interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  iconColor: string;
  textColor: string;
  secondaryColor: string;
}

export const MemoizedInfoRow = React.memo<InfoRowProps>(
  ({ icon, label, value, iconColor, textColor, secondaryColor }) => (
    <View style={infoStyles.row}>
      <Ionicons name={icon as any} size={16} color={iconColor} />
      <Text style={[infoStyles.label, { color: secondaryColor }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: textColor }]}>{value}</Text>
    </View>
  ),
  (prev, next) => prev.value === next.value && prev.label === next.label
);

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  label: {
    ...typography.caption,
    flex: 1,
  },
  value: {
    ...typography.bodyMedium,
    fontSize: 13,
  },
});

// ── Memoized Section Header ──
interface SectionHeaderProps {
  title: string;
  color: string;
  count?: number;
}

export const MemoizedSectionHeader = React.memo<SectionHeaderProps>(
  ({ title, color, count }) => (
    <View style={sectionStyles.row}>
      <Text style={[sectionStyles.title, { color }]}>{title}</Text>
      {count !== undefined && (
        <View style={[sectionStyles.badge, { backgroundColor: color + '20' }]}>
          <Text style={[sectionStyles.count, { color }]}>{count}</Text>
        </View>
      )}
    </View>
  ),
  (prev, next) => prev.title === next.title && prev.count === next.count
);

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...typography.label,
    letterSpacing: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  count: {
    ...typography.caption,
    fontWeight: '600',
  },
});

// ── Memoized Empty State ──
interface EmptyStateMemoProps {
  icon: string;
  title: string;
  subtitle: string;
  iconColor: string;
  titleColor: string;
  subtitleColor: string;
}

export const MemoizedEmptyState = React.memo<EmptyStateMemoProps>(
  ({ icon, title, subtitle, iconColor, titleColor, subtitleColor }) => (
    <View style={emptyStyles.container}>
      <Ionicons name={icon as any} size={48} color={iconColor} />
      <Text style={[emptyStyles.title, { color: titleColor }]}>{title}</Text>
      <Text style={[emptyStyles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
    </View>
  )
);

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 280,
  },
});
