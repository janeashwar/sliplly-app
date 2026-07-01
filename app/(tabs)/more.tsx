import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography } from '../../src/theme/colors';

import { useTheme } from '../../src/context/ThemeContext';
import { useScroll } from '../../src/context/ScrollContext';
import TabScreenTransition from '../../src/components/TabScreenTransition';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { setScrollPosition } = useScroll();

  const { colors, statusBadges, shadows, isDark } = useTheme();
  const styles = createStyles(colors, shadows, isDark);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setScrollPosition(contentOffset.y, contentSize.height, layoutMeasurement.height);
  };

  return (
    <TabScreenTransition tabIndex={3}>
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 80, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.emptyState}>
          <Ionicons name="construct-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>Coming Soon</Text>
          <Text style={styles.emptySubtitle}>This section is under development and will be available in a future update.</Text>
        </View>
      </ScrollView>

      {/* Header — absolute positioned */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>More</Text>
          </View>
        </View>
      </View>
    </View>
    </TabScreenTransition>
  );
}

const createStyles = (colors: any, shadows: any, isDark: boolean) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxxl * 2,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
  },

  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg.base,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  titleSection: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
});
