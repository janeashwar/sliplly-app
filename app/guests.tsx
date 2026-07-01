import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Keyboard,
  BackHandler,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, radius, typography, type Colors } from '../src/theme/colors';
import { useTheme } from '../src/context/ThemeContext';
import { hapticLight, hapticSelection } from '../src/utils/haptics';
import { Guest, formatCurrency } from '../src/data/placeholder';
import guestsApi, { Guest as ApiGuest } from '../src/api/guests';

import { PressableCard } from '../src/components/common';
import { toast } from '../src/utils/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_PADDING = spacing.lg;

const SUGGESTIONS = [
  'Rajesh Kumar', 'Amit Singh', 'Priya Sharma',
  'Infosys', 'TCS', 'Wipro',
  '9876543210', '8765432109',
];

export default function GuestsScreen() {
  const { colors, statusBadges, shadows, isDark, searchColors } = useTheme();
  const styles = getStyles(colors, isDark, shadows, searchColors);
  const insets = useSafeAreaInsets();

  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const searchProgress = useSharedValue(0);
  const gradientProgress = useSharedValue(0);
  const hasQuery = useSharedValue(0);

  // Parse hex border colors for animation
  const _bh = searchColors.barBorder.replace('#', '');
  const _bf = searchColors.barBorderFocus.replace('#', '');
  const borderFromR = parseInt(_bh.substring(0, 2), 16);
  const borderFromG = parseInt(_bh.substring(2, 4), 16);
  const borderFromB = parseInt(_bh.substring(4, 6), 16);
  const borderToR = parseInt(_bf.substring(0, 2), 16);
  const borderToG = parseInt(_bf.substring(2, 4), 16);
  const borderToB = parseInt(_bf.substring(4, 6), 16);

  // Real data state
  const [guestsData, setGuestsData] = useState<Guest[]>([]);

  const fetchGuests = useCallback(async () => {
    try {
      const data = await guestsApi.list();
      const list = Array.isArray(data) ? data : (data as any).content || (data as any).guests || [];
      // Normalize API data to match local Guest shape
      const normalized: Guest[] = list.map((g: any) => ({
        id: g.id,
        name: g.name || '',
        phone: g.phone || g.mobile || '',
        email: g.email || undefined,
        company: g.company || undefined,
        tripCount: g.tripCount || g.totalTrips || 0,
        totalSpent: g.totalSpent || 0,
        lastTripDate: g.lastTripDate || g.updatedAt || new Date().toISOString(),
      }));
      setGuestsData(normalized);
    } catch (err) {
      console.error('Failed to fetch guests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    hasQuery.value = withTiming(text.trim().length > 0 ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.quad),
    });
  }, []);

  const filtered = guestsData.filter((g) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      g.name.toLowerCase().includes(q) ||
      g.phone.includes(q) ||
      (g.company && g.company.toLowerCase().includes(q))
    );
  });

  const handleSearchReady = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const enterSearch = useCallback(() => {
    setIsSearching(true);
    searchProgress.value = withTiming(1, {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }, () => {
      runOnJS(handleSearchReady)();
    });
    gradientProgress.value = withDelay(200, withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }));
  }, []);

  const exitSearch = useCallback(() => {
    Keyboard.dismiss();
    gradientProgress.value = withTiming(0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    searchProgress.value = withTiming(0, {
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    hasQuery.value = 0;
    setIsSearching(false);
    setQuery('');
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGuests();
  }, [fetchGuests]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSearching) { exitSearch(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [isSearching, exitSearch]);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1
      ? parts[0][0] + parts[parts.length - 1][0]
      : name.substring(0, 2);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const renderGuest = ({ item }: { item: Guest }) => (
    <PressableCard style={styles.card} onPress={() => toast.info(`Phone: ${item.phone}\n${item.company ? `Company: ${item.company}\n` : ''}Trips: ${item.tripCount}\nTotal Spent: ${formatCurrency(item.totalSpent)}`, item.name)}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.guestInfo}>
          <Text style={styles.guestName}>{item.name}</Text>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={13} color={colors.text.tertiary} />
            <Text style={styles.guestPhone}>{item.phone}</Text>
          </View>
          {item.company && (
            <View style={styles.companyRow}>
              <Ionicons name="business-outline" size={13} color={colors.text.tertiary} />
              <Text style={styles.companyText}>{item.company}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.statItem}>
          <Ionicons name="car-outline" size={14} color={colors.text.tertiary} />
          <Text style={styles.statText}>{item.tripCount} trips</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="wallet-outline" size={14} color={colors.accent.primary} />
          <Text style={[styles.statText, { color: colors.accent.primary }]}>
            {formatCurrency(item.totalSpent)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
          <Text style={styles.statText}>{formatDate(item.lastTripDate)}</Text>
        </View>
      </View>
    </PressableCard>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={48} color={colors.text.tertiary} />
      <Text style={styles.emptyText}>
        {query.trim() ? 'No guests found' : 'Guests will appear here once added'}
      </Text>
    </View>
  );

  // Animations
  const titleContainerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(searchProgress.value, [0, 0.2], [1, 0], Extrapolation.CLAMP),
  }));

  const listStyle = useAnimatedStyle(() => ({
    opacity: interpolate(searchProgress.value, [0, 0.3], [1, 0], Extrapolation.CLAMP),
  }));

  const SEARCH_BAR_START_Y = insets.top + spacing.xl + 28 + spacing.md;
  const SEARCH_BAR_END_Y = insets.top + 12;

  const searchRowStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      searchProgress.value,
      [0, 1],
      [0, SEARCH_BAR_END_Y - SEARCH_BAR_START_Y],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      searchProgress.value,
      [0, 0.25, 0.5, 0.75, 1],
      [1, 1.03, 0.97, 1.01, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
      opacity: interpolate(searchProgress.value, [0, 0.15, 0.85, 1], [1, 0.9, 0.95, 1], Extrapolation.CLAMP),
    };
  });

  const searchBarStyle = useAnimatedStyle(() => {
    const widthPercent = interpolate(
      searchProgress.value,
      [0, 0.3, 0.7],
      [100, 100, 78],
      Extrapolation.CLAMP
    );

    const borderRadius = interpolate(
      searchProgress.value,
      [0, 1],
      [24, 12],
      Extrapolation.CLAMP
    );

    const borderColorR = interpolate(searchProgress.value, [0, 1], [borderFromR, borderToR], Extrapolation.CLAMP);
    const borderColorG = interpolate(searchProgress.value, [0, 1], [borderFromG, borderToG], Extrapolation.CLAMP);
    const borderColorB = interpolate(searchProgress.value, [0, 1], [borderFromB, borderToB], Extrapolation.CLAMP);

    return {
      width: `${widthPercent}%`,
      borderRadius,
      borderColor: `rgb(${borderColorR}, ${borderColorG}, ${borderColorB})`,
    };
  });

  const cancelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(searchProgress.value, [0.3, 0.6], [0, 1], Extrapolation.CLAMP),
  }));

  const gradientStyle = useAnimatedStyle(() => ({
    opacity: gradientProgress.value,
  }));

  const suggestionsStyle = useAnimatedStyle(() => {
    const baseOpacity = interpolate(searchProgress.value, [0.6, 1], [0, 1], Extrapolation.CLAMP);
    const baseTranslateY = interpolate(searchProgress.value, [0.6, 1], [15, 0], Extrapolation.CLAMP);

    const queryScale = interpolate(hasQuery.value, [0, 0.3, 0.6, 0.8, 1], [1, 1.02, 0.93, 0.87, 0.85], Extrapolation.CLAMP);
    const queryOpacity = interpolate(hasQuery.value, [0, 0.2, 0.5, 1], [1, 0.85, 0.5, 0], Extrapolation.CLAMP);

    return {
      opacity: baseOpacity * queryOpacity,
      transform: [
        { translateY: baseTranslateY },
        { scale: queryScale },
      ],
    };
  });

  const resultsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(hasQuery.value, [0.4, 0.7, 1], [0, 0.8, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(hasQuery.value, [0.4, 0.7, 1], [80, 10, 0], Extrapolation.CLAMP) },
    ],
  }));

  const LIST_PADDING_TOP = 140 + insets.top;

  return (
    <View style={styles.screen}>
      {/* Gradient */}
      <Animated.View style={[styles.gradientBg, gradientStyle]} pointerEvents="none">
        <LinearGradient
          colors={searchColors.gradientColors as [string, string]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Guest list */}
      <Animated.View style={[styles.listContainer, listStyle]} pointerEvents={isSearching ? 'none' : 'auto'}>
        {loading ? (
          <View style={[styles.listContent, { paddingTop: LIST_PADDING_TOP }]}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          </View>
        ) : (
          <Animated.FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderGuest}
            contentContainerStyle={[styles.listContent, { paddingTop: LIST_PADDING_TOP }]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            ListEmptyComponent={renderEmpty}
            ListHeaderComponent={
              <Text style={styles.resultCount}>{guestsData.length} guest{guestsData.length !== 1 ? 's' : ''}</Text>
            }
          />
        )}
      </Animated.View>

      {/* Title */}
      <Animated.View style={[styles.titleContainer, { paddingTop: insets.top + spacing.md }, titleContainerStyle]}>
        <View style={styles.titleRow}>
          <Text style={styles.largeTitle}>Guests</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{guestsData.length}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Search ROW */}
      <Animated.View
        style={[
          styles.searchRowBase,
          { top: SEARCH_BAR_START_Y },
          searchRowStyle,
        ]}
      >
        <Animated.View style={[styles.searchBar, searchBarStyle]}>
          <Pressable style={styles.searchBarInner} onPress={!isSearching ? enterSearch : undefined}>
            <Ionicons name="search-outline" size={18} color={colors.text.tertiary} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search by name, phone, or company..."
              placeholderTextColor={searchColors.placeholder}
              value={query}
              onChangeText={handleQueryChange}
              editable={isSearching}
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => handleQueryChange('')} hitSlop={8}>
                <Ionicons name="close-circle-outline" size={18} color={colors.text.tertiary} />
              </Pressable>
            )}
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.cancelWrap, cancelStyle]}>
          <Pressable onPress={exitSearch} hitSlop={12}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* Suggestions */}
      <Animated.View style={[styles.suggestionsWrap, suggestionsStyle, { paddingTop: SEARCH_BAR_END_Y + 56 }]} pointerEvents={isSearching ? 'auto' : 'none'}>
        <Text style={styles.suggestionsTitle}>Suggestions</Text>
        <View style={styles.chipsGrid}>
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} style={styles.chip} onPress={() => { hapticSelection(); handleQueryChange(s); }}>
              <Text style={styles.chipText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Search results */}
      <Animated.View style={[styles.resultsWrap, resultsStyle, { paddingTop: SEARCH_BAR_END_Y + 56 }]} pointerEvents={isSearching ? 'auto' : 'none'}>
        {query.trim() !== '' && (
          <Animated.FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderGuest}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            }
          />
        )}
      </Animated.View>
    </View>
  );
}

const getStyles = (colors: Colors, isDark: boolean, shadows: any, searchColors: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg.base },

  gradientBg: {
    ...StyleSheet.absoluteFillObject, zIndex: 10,
  },

  listContainer: { flex: 1, zIndex: 20 },
  listContent: { paddingHorizontal: PAGE_PADDING, paddingBottom: spacing.xxl },
  resultCount: { ...typography.caption, color: colors.text.tertiary, marginBottom: spacing.md },

  titleContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
    paddingHorizontal: PAGE_PADDING,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg.base,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  largeTitle: {
    fontWeight: '700', color: colors.text.primary, letterSpacing: -0.8,
    fontSize: 28,
    flex: 1,
  },
  headerBadge: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    minWidth: 28,
    alignItems: 'center',
  },
  headerBadgeText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '700',
  },

  searchRowBase: {
    position: 'absolute', left: 0, right: 0, zIndex: 40,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: PAGE_PADDING,
    height: 48,
  },
  searchBar: {
    height: 48,
    backgroundColor: searchColors.barBg,
    borderWidth: 1, borderColor: searchColors.barBorder,
    borderRadius: 24,
    overflow: 'hidden',
  },
  searchBarInner: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, gap: spacing.sm,
  },
  searchInput: {
    flex: 1, ...typography.body, color: colors.text.primary,
    paddingVertical: 0,
  },

  cancelWrap: {
    width: 60,
    height: 48,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  cancelText: {
    ...typography.bodyMedium,
    color: searchColors.cancelText,
    fontWeight: '600',
  },

  suggestionsWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 35,
    paddingHorizontal: PAGE_PADDING,
  },
  suggestionsTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.md },

  resultsWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 36,
    paddingHorizontal: PAGE_PADDING,
  },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: colors.bg.surface, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border.subtle,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  chipText: { ...typography.caption, color: colors.text.secondary, fontWeight: '500' },
  resultsList: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxxl * 2 },
  emptyText: { ...typography.body, color: colors.text.tertiary, marginTop: spacing.md },

  // Card
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...(!isDark ? shadows.low : {}),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.h3,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  guestPhone: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  companyText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});
