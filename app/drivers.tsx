import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import { hapticSelection } from '../src/utils/haptics';
import { Driver } from '../src/data/placeholder';
import driversApi, { Driver as ApiDriver } from '../src/api/drivers';

import { PressableCard } from '../src/components/common';
import { toast } from '../src/utils/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_PADDING = spacing.lg;

type StatusFilter = 'All' | 'Available' | 'On Trip' | 'Off Duty';

const STATUS_FILTERS: StatusFilter[] = ['All', 'Available', 'On Trip', 'Off Duty'];

const SUGGESTIONS = [
  'Rajesh Kumar', 'Amit Singh', 'Suresh Patel',
  '9876543210', '8765432109',
  'Swift Dzire', 'Innova Crysta',
];

export default function DriversScreen() {
  const { colors, statusBadges, shadows, isDark, searchColors } = useTheme();
  const styles = getStyles(colors, isDark, shadows, searchColors);
  const insets = useSafeAreaInsets();

  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');
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
  const [driversData, setDriversData] = useState<Driver[]>([]);

  const fetchDrivers = useCallback(async () => {
    try {
      const data = await driversApi.list();
      const list = Array.isArray(data) ? data : (data as any).content || (data as any).drivers || [];
      // Normalize API data to match local Driver shape
      const normalized: Driver[] = list.map((d: any) => ({
        id: d.id,
        name: d.name || '',
        phone: d.phone || '',
        licenseNumber: d.licenseNo || d.licenseNumber || '',
        status: d.status === 'ACTIVE' ? 'Available' : d.status === 'ON_DUTY' ? 'On Trip' : d.status === 'INACTIVE' ? 'Off Duty' : d.status || 'Available',
        rating: d.rating || 0,
        assignedVehicle: d.assignedVehicle?.name || d.vehicleName || d.assignedVehicle || undefined,
        tripCount: d.tripCount || d.totalTrips || 0,
        joinDate: d.joinDate || d.createdAt || new Date().toISOString(),
      }));
      setDriversData(normalized);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    hasQuery.value = withTiming(text.trim().length > 0 ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.quad),
    });
  }, []);

  const filtered = driversData.filter((d) => {
    const matchesSearch = !query.trim() ||
      d.name.toLowerCase().includes(query.toLowerCase().trim()) ||
      d.phone.includes(query) ||
      (d.assignedVehicle && d.assignedVehicle.toLowerCase().includes(query.toLowerCase().trim()));

    const matchesFilter = activeFilter === 'All' || d.status === activeFilter;

    return matchesSearch && matchesFilter;
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
    fetchDrivers();
  }, [fetchDrivers]);

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

  const getStatusBadge = (status: Driver['status']) => {
    switch (status) {
      case 'Available': return statusBadges.confirmed;
      case 'On Trip': return statusBadges.inProgress;
      case 'Off Duty': return statusBadges.cancelled;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={14} color={colors.accent.primary} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={14} color={colors.accent.primary} />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={14} color={colors.text.tertiary} />
        );
      }
    }

    return stars;
  };

  const filterCounts = {
    All: driversData.length,
    Available: driversData.filter(d => d.status === 'Available').length,
    'On Trip': driversData.filter(d => d.status === 'On Trip').length,
    'Off Duty': driversData.filter(d => d.status === 'Off Duty').length,
  };

  const renderDriver = ({ item }: { item: Driver }) => (
    <PressableCard style={styles.card} onPress={() => toast.info(`Phone: ${item.phone}\nStatus: ${item.status}\nRating: ${item.rating.toFixed(1)}\nVehicle: ${item.assignedVehicle || 'None'}\nTrips: ${item.tripCount}`, item.name)}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{item.name}</Text>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={13} color={colors.text.tertiary} />
            <Text style={styles.driverPhone}>{item.phone}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBadge(item.status).bg }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusBadge(item.status).text }]} />
          <Text style={[styles.statusText, { color: getStatusBadge(item.status).text }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.ratingRow}>
        <View style={styles.starsContainer}>
          {renderStars(item.rating)}
        </View>
        <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="car-outline" size={14} color={colors.text.tertiary} />
          <Text style={styles.footerText}>
            {item.assignedVehicle || 'No vehicle'}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="navigate-outline" size={14} color={colors.text.tertiary} />
          <Text style={styles.footerText}>{item.tripCount} trips</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
          <Text style={styles.footerText}>
            {new Date(item.joinDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
          </Text>
        </View>
      </View>
    </PressableCard>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={48} color={colors.text.tertiary} />
      <Text style={styles.emptyText}>
        {query.trim() || activeFilter !== 'All' ? 'No drivers found' : 'Drivers will appear here once added'}
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

  const FilterChips = () => (
    <View style={styles.filtersContainer}>
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersList}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.filterChip,
              activeFilter === item && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(item)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === item && styles.filterChipTextActive,
              ]}
            >
              {item}
            </Text>
            <View style={[
              styles.filterCount,
              activeFilter === item && styles.filterCountActive,
            ]}>
              <Text style={[
                styles.filterCountText,
                activeFilter === item && styles.filterCountTextActive,
              ]}>
                {filterCounts[item]}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );

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

      {/* Driver list */}
      <Animated.View style={[styles.listContainer, listStyle]} pointerEvents={isSearching ? 'none' : 'auto'}>
        {loading ? (
          <View style={[styles.listContent, { paddingTop: LIST_PADDING_TOP }]}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderDriver}
            contentContainerStyle={[styles.listContent, { paddingTop: LIST_PADDING_TOP }]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            ListEmptyComponent={renderEmpty}
            ListHeaderComponent={
              <View>
                <Text style={styles.resultCount}>{driversData.length} driver{driversData.length !== 1 ? 's' : ''}</Text>
                <FilterChips />
              </View>
            }
          />
        )}
      </Animated.View>

      {/* Title */}
      <Animated.View style={[styles.titleContainer, { paddingTop: insets.top + spacing.md }, titleContainerStyle]}>
        <View style={styles.titleRow}>
          <Text style={styles.largeTitle}>Drivers</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{driversData.length}</Text>
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
              placeholder="Search by name, phone, or vehicle..."
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
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderDriver}
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

  // Filters
  filtersContainer: {
    marginBottom: spacing.md,
  },
  filtersList: {
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.text.inverse,
  },
  filterCount: {
    backgroundColor: colors.bg.overlay,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  filterCountActive: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  filterCountText: {
    ...typography.label,
    color: colors.text.secondary,
    fontSize: 10,
  },
  filterCountTextActive: {
    color: colors.text.inverse,
  },

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
  driverInfo: {
    flex: 1,
  },
  driverName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  driverPhone: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },

  // Rating
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
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
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  footerText: {
    ...typography.caption,
    color: colors.text.tertiary,
    flex: 1,
  },
});
