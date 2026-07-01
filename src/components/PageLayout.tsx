import React from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import ScreenHeader from './ScreenHeader';

interface PageLayoutProps {
  title: string;
  children?: React.ReactNode;
  scrollable?: boolean;
  data?: any[];
  renderItem?: ({ item, index }: { item: any; index: number }) => React.ReactElement;
  keyExtractor?: (item: any) => string;
  headerRight?: React.ReactNode;
}

export default function PageLayout({
  title,
  children,
  scrollable = true,
  data,
  renderItem,
  keyExtractor,
  headerRight,
}: PageLayoutProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, shadows } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.screen}>
      <ScreenHeader title={title} rightAction={headerRight} />

      {scrollable ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 120 + insets.top }]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : data && renderItem ? (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor || ((_, i) => i.toString())}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 120 + insets.top }]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        />
      ) : (
        <View style={[styles.content, { paddingTop: 120 + insets.top }]}>
          {children}
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
