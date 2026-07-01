import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Keyboard,
  BackHandler,
  Dimensions,
  LayoutChangeEvent,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, radius, typography } from '../../src/theme/colors';
import { formatCurrency, Trip } from '../../src/data/placeholder';
import tripsApi, { Trip as ApiTrip } from '../../src/api/trips';
import { useTheme } from '../../src/context/ThemeContext';
import { hapticSelection, hapticLight } from '../../src/utils/haptics';
import { useScroll } from '../../src/context/ScrollContext';
import { toast } from '../../src/utils/toast';
import GlassCard from '../../src/components/common/GlassCard';
import SwipeableRow from '../../src/components/gestures/SwipeableRow';
import LongPressMenu from '../../src/components/gestures/LongPressMenu';
import TabScreenTransition from '../../src/components/TabScreenTransition';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_PADDING = spacing.lg; // 16px
const CARD_GAP = spacing.md; // 12px

const SCROLL_END = 120;
const PHASE_1_END = 30;
const PHASE_2_END = 80;

const SUGGESTIONS = [
  'Rajesh Kumar', 'Amit Singh', 'Mumbai', 'Pune',
  'Airport', 'Confirmed', 'Pending', 'Swift Dzire',
];

// ── Store card layouts for hero transition ──
const cardLayouts: Record<string, { y: number; height: number }> = {};

// ── Trip Card with layout tracking + press animation for hero transition ──
const PRESS_SPRING = { stiffness: 400, damping: 20, mass: 0.8 };

function TripCard({
  item,
  index,
  listPaddingTop,
  onNavigate,
  colors,
  statusBadges,
  styles,
}: {
  item: Trip;
  index: number;
  listPaddingTop: number;
  onNavigate: (trip: Trip, originX: number, originY: number, originW: number, originH: number) => void;
  colors: any;
  statusBadges: any;
  styles: any;
}) {
  const statusMap: Record<string, string> = {
    INITIATED: 'pending',
    ASSIGNED: 'inProgress',
    ON_DUTY: 'inProgress',
    COMPLETED: 'confirmed',
    FINALIZE_CHARGES: 'confirmed',
    CANCELLED: 'cancelled',
  };
  const tripStatus = item.status || item.tripStatus || 'INITIATED';
  const badge = statusBadges[statusMap[tripStatus] || 'pending'];
  const pressScale = useSharedValue(1);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    const absoluteY = listPaddingTop + index * (height + CARD_GAP);
    cardLayouts[item.id] = { y: absoluteY, height };
  }, [item.id, index, listPaddingTop]);

  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.95, PRESS_SPRING);
  }, []);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, PRESS_SPRING);
  }, []);

  const handlePress = useCallback(() => {
    const layout = cardLayouts[item.id];
    if (layout) {
      const originX = PAGE_PADDING;
      const originY = layout.y;
      const originW = SCREEN_WIDTH - PAGE_PADDING * 2;
      const originH = layout.height;
      onNavigate(item, originX, originY, originW, originH);
    } else {
      onNavigate(item, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }
  }, [item, onNavigate]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  // Normalize trip fields (API may use different field names)
  const guestName = item.guestName || (item as any).guest?.name || '—';
  const phone = item.phone || item.guestPhone || item.guestContact || (item as any).guest?.phone || '';
  const from = item.from || item.pickupLocation || '—';
  const to = item.to || item.dropLocation || '—';
  const distance = item.distance || (item.totalKm ? `${item.totalKm} km` : (item as any).totalDistance ? `${(item as any).totalDistance} km` : '—');
  const duration = item.duration || '—';
  const vehicle = item.vehicle || (typeof item.assignedVehicle === 'object' ? (item.assignedVehicle as any).name : item.assignedVehicle) || '—';
  const driver = item.driver || item.driverName || (typeof item.assignedDriver === 'object' ? (item.assignedDriver as any).name : item.assignedDriver) || 'Pending';
  const amount = item.amount || item.totalAmount || 0;
  const date = item.date || item.startDate || item.pickupDatetime?.split('T')[0] || '';
  const time = item.time || item.pickupDatetime?.split('T')[1]?.substring(0, 5) || '';

  return (
    <View onLayout={handleLayout}>
      <Animated.View style={pressStyle}>
        <SwipeableRow
          rightAction={{
            icon: 'trash-outline',
            label: 'Delete',
            color: '#fff',
            backgroundColor: '#EF4444',
            onPress: () => {
              toast.info(`Trip ${item.id} deleted`, 'Deleted');
            },
          }}
          leftAction={{
            icon: 'create-outline',
            label: 'Edit',
            color: '#fff',
            backgroundColor: colors.semantic.info,
            onPress: () => {
              toast.info(`Editing trip ${item.id}`, 'Edit');
            },
          }}
        >
          <LongPressMenu
            actions={[
              { icon: 'create-outline', label: 'Edit Trip', onPress: () => toast.info('Edit trip', 'Coming Soon') },
              { icon: 'copy-outline', label: 'Duplicate', onPress: () => toast.info('Duplicate trip', 'Coming Soon') },
              { icon: 'share-outline', label: 'Share', onPress: () => toast.info('Share trip', 'Coming Soon') },
              { icon: 'trash-outline', label: 'Delete', onPress: () => toast.warning('Trip deleted', 'Deleted'), destructive: true },
            ]}
          >
            <Pressable
              style={styles.tripCardPressable}
              onPress={handlePress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <GlassCard variant="default" style={styles.tripCardInner}>
                <View style={styles.tripTop}>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: badge.text }]} />
                    <Text style={[styles.statusText, { color: badge.text }]}>
                      {(() => {
                        const labels: Record<string, string> = {
                          INITIATED: 'Initiated', ASSIGNED: 'Assigned', ON_DUTY: 'On Duty',
                          COMPLETED: 'Completed', FINALIZE_CHARGES: 'Finalize', CANCELLED: 'Cancelled',
                        };
                        return labels[tripStatus] || tripStatus;
                      })()}
                    </Text>
                  </View>
                  <Text style={styles.tripAmount}>{formatCurrency(amount)}</Text>
                </View>
                <View style={styles.guestRow}>
                  <Ionicons name="person-outline" size={14} color={colors.text.secondary} />
                  <Text style={styles.guestName}>{guestName}</Text>
                  {phone ? (
                    <>
                      <Ionicons name="call-outline" size={13} color={colors.text.tertiary} style={{ marginLeft: spacing.md }} />
                      <Text style={styles.guestPhone}>{phone}</Text>
                    </>
                  ) : null}
                </View>
                <View style={styles.routeContainer}>
                  <View style={styles.routeLeft}>
                    <View style={styles.routeDots}>
                      <View style={[styles.routeDot, { backgroundColor: colors.semantic.success }]} />
                      <View style={styles.routeLine} />
                      <View style={[styles.routeDot, { backgroundColor: colors.semantic.error }]} />
                    </View>
                    <View style={styles.routeTexts}>
                      <Text style={styles.routeFrom}>{from}</Text>
                      <Text style={styles.routeTo}>{to}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <MetaItem icon="navigate" value={distance} colors={colors} styles={styles} />
                  <MetaItem icon="time" value={duration} colors={colors} styles={styles} />
                  <MetaItem icon="car" value={vehicle} colors={colors} styles={styles} />
                </View>
                <View style={styles.tripFooter}>
                  <View style={styles.footerLeft}>
                    <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
                    <Text style={styles.footerText}>{date} · {time}</Text>
                  </View>
                  <View style={styles.footerRight}>
                    <Ionicons name="person-outline" size={14} color={colors.text.tertiary} />
                    <Text style={styles.footerText}>{driver}</Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          </LongPressMenu>
        </SwipeableRow>
      </Animated.View>
    </View>
  );
}

export default function TripsScreen() {
  const insets = useSafeAreaInsets();

  const router = useRouter();
  const { setScrollPosition } = useScroll();
  const scrollY = useSharedValue(0);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const { colors, statusBadges, shadows, isDark, searchColors } = useTheme();
  const styles = createStyles(colors, shadows, isDark, searchColors);

  // Real data state
  const [tripsData, setTripsData] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      setError(null);
      const data = await tripsApi.list();
      // Normalize API response — could be array or object with trips array
      const tripList = Array.isArray(data) ? data : (data as any).content || (data as any).trips || [];
      setTripsData(tripList);
    } catch (err: any) {
      console.error('Failed to fetch trips:', err);
      setError(err?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, []);

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

  const LIST_PADDING_TOP = 140 + insets.top;

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    hasQuery.value = withTiming(text.trim().length > 0 ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.quad),
    });
  }, []);

  const filtered = tripsData.filter((t) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    const guestName = (t.guestName || '').toLowerCase();
    const phone = t.phone || t.guestPhone || t.guestContact || '';
    const status = (t.status || t.tripStatus || '').toLowerCase();
    const driver = (t.driver || t.driverName || '').toLowerCase();
    const from = (t.from || t.pickupLocation || '').toLowerCase();
    const to = (t.to || t.dropLocation || '').toLowerCase();
    return (
      guestName.includes(q) ||
      phone.includes(q) ||
      driver.includes(q) ||
      from.includes(q) ||
      to.includes(q) ||
      status.includes(q)
    );
  });

  const updateScrollContext = useCallback((y: number, contentHeight: number, layoutHeight: number) => {
    setScrollPosition(y, contentHeight, layoutHeight);
  }, [setScrollPosition]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      runOnJS(updateScrollContext)(e.contentOffset.y, e.contentSize.height, e.layoutMeasurement.height);
    },
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

  const navigateToTripDetail = useCallback((trip: Trip, originX: number, originY: number, originW: number, originH: number) => {
    const adjustedY = originY - scrollY.value;
    router.push({
      pathname: '/trip-details',
      params: {
        tripId: trip.id,
        originX: String(originX),
        originY: String(adjustedY),
        originW: String(originW),
        originH: String(originH),
      },
    });
  }, [router, scrollY]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSearching) { exitSearch(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [isSearching, exitSearch]);

  // Animations
  const titleContainerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(searchProgress.value, [0, 0.2], [1, 0], Extrapolation.CLAMP),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(scrollY.value, [0, PHASE_1_END, PHASE_2_END, SCROLL_END], [1, 1, 0.75, 0.75], Extrapolation.CLAMP) },
    ],
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

    const shadowOpacity = interpolate(searchProgress.value, [0, 0.5, 1], [0, 0.3, 0.5], Extrapolation.CLAMP);
    const shadowRadius = interpolate(searchProgress.value, [0, 0.5, 1], [0, 8, 16], Extrapolation.CLAMP);

    return {
      width: `${widthPercent}%`,
      borderRadius,
      borderColor: `rgb(${borderColorR}, ${borderColorG}, ${borderColorB})`,
      shadowColor: `rgb(${borderToR}, ${borderToG}, ${borderToB})`,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius,
      elevation: searchProgress.value * 8,
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

  if (loading) {
    return (
      <TabScreenTransition tabIndex={1}>
        <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[typography.body, { color: colors.text.tertiary, marginTop: spacing.md }]}>Loading trips...</Text>
        </View>
      </TabScreenTransition>
    );
  }

  return (
    <TabScreenTransition tabIndex={1}>
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

      {/* Trip list */}
      <Animated.View style={[styles.listContainer, listStyle]} pointerEvents={isSearching ? 'none' : 'auto'}>
        <Animated.FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TripCard
              item={item}
              index={index}
              listPaddingTop={LIST_PADDING_TOP}
              onNavigate={navigateToTripDetail}
              colors={colors}
              statusBadges={statusBadges}
              styles={styles}
            />
          )}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={[styles.listContent, { paddingTop: LIST_PADDING_TOP }]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: CARD_GAP }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchTrips(); }}
              tintColor={colors.accent.primary}
            />
          }
          ListHeaderComponent={
            <>
              {error && (
                <View style={{ padding: spacing.sm, marginBottom: spacing.sm, backgroundColor: colors.semantic.error + '18', borderRadius: radius.sm }}>
                  <Text style={{ color: colors.semantic.error, ...typography.caption }}>{error}</Text>
                </View>
              )}
              <Text style={styles.resultCount}>{filtered.length} trip{filtered.length !== 1 ? 's' : ''}</Text>
            </>
          }
        />
      </Animated.View>

      {/* Title */}
      <Animated.View style={[styles.titleContainer, { paddingTop: insets.top + spacing.md }, titleContainerStyle]}>
        <View style={styles.titleRow}>
          <Animated.Text style={[styles.largeTitle, titleStyle]}>
            Trips
          </Animated.Text>
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
              placeholder="Search guest, phone, driver, location..."
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
            renderItem={({ item, index }) => (
              <TripCard
                item={item}
                index={index}
                listPaddingTop={LIST_PADDING_TOP}
                onNavigate={navigateToTripDetail}
                colors={colors}
                statusBadges={statusBadges}
                styles={styles}
              />
            )}
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
    </TabScreenTransition>
  );
}

function MetaItem({ icon, value, colors, styles }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: string; colors: any; styles: any }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={14} color={colors.text.tertiary} />
      <Text style={styles.metaText}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: any, shadows: any, isDark: boolean, searchColors: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg.base },

  gradientBg: {
    ...StyleSheet.absoluteFillObject, zIndex: 10,
  },

  listContainer: { flex: 1, zIndex: 20 },
  listContent: { paddingHorizontal: PAGE_PADDING, paddingBottom: 120 },
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
    transformOrigin: 'top left',
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
    ...(!isDark ? shadows.low : {}),
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

  tripCardPressable: {},
  tripCardInner: {
    padding: spacing.lg,
  },
  tripTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...typography.caption, fontWeight: '600' },
  tripAmount: { ...typography.h3, color: colors.text.primary },
  guestRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: 6 },
  guestName: { ...typography.bodyMedium, color: colors.text.primary },
  guestPhone: { ...typography.caption, color: colors.text.secondary },
  routeContainer: { marginBottom: spacing.md },
  routeLeft: { flexDirection: 'row', gap: spacing.md },
  routeDots: { alignItems: 'center', paddingTop: 4 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { width: 2, height: 30, backgroundColor: colors.border.default, marginVertical: 2 },
  routeTexts: { flex: 1, gap: spacing.sm },
  routeFrom: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '500' },
  routeTo: { ...typography.bodyMedium, color: colors.text.secondary },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.caption, color: colors.text.tertiary },
  tripFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border.subtle, paddingTop: spacing.sm },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { ...typography.caption, color: colors.text.tertiary },
});
