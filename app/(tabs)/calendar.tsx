import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography } from '../../src/theme/colors';
import { Trip, formatCurrency } from '../../src/data/placeholder';
import tripsApi from '../../src/api/trips';
import { useTheme } from '../../src/context/ThemeContext';
import { useScroll } from '../../src/context/ScrollContext';
import TabScreenTransition from '../../src/components/TabScreenTransition';
import { hapticLight, hapticSelection } from '../../src/utils/haptics';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type ViewMode = 'month' | 'week' | 'day';

const STATUS_COLORS: Record<string, string> = {
  INITIATED: '#9CA3AF',
  ASSIGNED: '#F59E0B',
  ON_DUTY: '#3B82F6',
  COMPLETED: '#10B981',
  FINALIZE_CHARGES: '#8B5CF6',
  CANCELLED: '#EF4444',
};

const STATUS_LABELS: Record<string, string> = {
  INITIATED: 'Initiated',
  ASSIGNED: 'Assigned',
  ON_DUTY: 'On Duty',
  COMPLETED: 'Completed',
  FINALIZE_CHARGES: 'Finalize',
  CANCELLED: 'Cancelled',
};

const SCREEN_WIDTH = Dimensions.get('window').width;

const generateCalendarDays = (month: number, year: number): (number | null)[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rawDay = new Date(year, month, 1).getDay();
  const startDay = rawDay === 0 ? 6 : rawDay - 1;
  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
};

const getTripsForDay = (day: number, month: number, year: number, trips: Trip[]): Trip[] => {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return trips.filter((t) => {
    const tDate = t.date || t.startDate || '';
    return tDate === dateStr;
  });
};

const getWeekDates = (date: Date): Date[] => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    dates.push(dd);
  }
  return dates;
};

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { setScrollPosition } = useScroll();
  const { colors, shadows, isDark } = useTheme();
  const styles = createStyles(colors, shadows, isDark);

  const realToday = new Date();
  const [currentMonth, setCurrentMonth] = useState(realToday.getMonth());
  const [currentYear, setCurrentYear] = useState(realToday.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number>(realToday.getDate());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [weekRefDate, setWeekRefDate] = useState(new Date(realToday));
  const [dayRefDate, setDayRefDate] = useState(new Date(realToday));

  // Real data state
  const [tripsData, setTripsData] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = useCallback(async () => {
    try {
      const data = await tripsApi.list();
      const tripList = Array.isArray(data) ? data : (data as any).trips || [];
      setTripsData(tripList);
    } catch (err) {
      console.error('Failed to fetch calendar trips:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, []);

  const todayMonth = realToday.getMonth();
  const todayYear = realToday.getFullYear();
  const todayDate = realToday.getDate();

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 0) { setCurrentYear((y) => y - 1); return 11; }
      return m - 1;
    });
    setSelectedDay(1);
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 11) { setCurrentYear((y) => y + 1); return 0; }
      return m + 1;
    });
    setSelectedDay(1);
  }, []);

  const goToPrevWeek = useCallback(() => {
    setWeekRefDate((d) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() - 7);
      return nd;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekRefDate((d) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + 7);
      return nd;
    });
  }, []);

  const goToPrevDay = useCallback(() => {
    setDayRefDate((d) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() - 1);
      return nd;
    });
  }, []);

  const goToNextDay = useCallback(() => {
    setDayRefDate((d) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + 1);
      return nd;
    });
  }, []);

  const goToToday = useCallback(() => {
    hapticSelection();
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedDay(now.getDate());
    setWeekRefDate(new Date(now));
    setDayRefDate(new Date(now));
  }, []);

  const goToPrev = useCallback(() => {
    hapticLight();
    if (viewMode === 'month') goToPrevMonth();
    else if (viewMode === 'week') goToPrevWeek();
    else goToPrevDay();
  }, [viewMode, goToPrevMonth, goToPrevWeek, goToPrevDay]);

  const goToNext = useCallback(() => {
    hapticLight();
    if (viewMode === 'month') goToNextMonth();
    else if (viewMode === 'week') goToNextWeek();
    else goToNextDay();
  }, [viewMode, goToNextMonth, goToNextWeek, goToNextDay]);

  const calendarDays = useMemo(
    () => generateCalendarDays(currentMonth, currentYear),
    [currentMonth, currentYear],
  );

  const selectedTrips = useMemo(
    () => getTripsForDay(selectedDay, currentMonth, currentYear, tripsData),
    [selectedDay, currentMonth, currentYear, tripsData],
  );

  const weekDates = useMemo(() => getWeekDates(weekRefDate), [weekRefDate]);

  const dayTrips = useMemo(() => {
    const d = dayRefDate;
    return getTripsForDay(d.getDate(), d.getMonth(), d.getFullYear(), tripsData);
  }, [dayRefDate, tripsData]);

  const isCurrentMonth = currentMonth === todayMonth && currentYear === todayYear;

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setScrollPosition(contentOffset.y, contentSize.height, layoutMeasurement.height);
  };

  const getHeaderTitle = () => {
    if (viewMode === 'month') return `${MONTH_NAMES[currentMonth]} ${currentYear}`;
    if (viewMode === 'week') {
      const first = weekDates[0];
      const last = weekDates[6];
      if (first.getMonth() === last.getMonth()) {
        return `${SHORT_MONTH_NAMES[first.getMonth()]} ${first.getDate()}-${last.getDate()}, ${first.getFullYear()}`;
      }
      return `${SHORT_MONTH_NAMES[first.getMonth()]} ${first.getDate()} - ${SHORT_MONTH_NAMES[last.getMonth()]} ${last.getDate()}, ${last.getFullYear()}`;
    }
    const d = dayRefDate;
    return `${SHORT_MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const parseTime = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return h + m / 60;
  };

  const parseDuration = (durStr: string): number => {
    let total = 0;
    const hMatch = durStr.match(/(\d+)h/);
    const mMatch = durStr.match(/(\d+)m/);
    if (hMatch) total += parseInt(hMatch[1]);
    if (mMatch) total += parseInt(mMatch[1]) / 60;
    return Math.max(total, 0.5);
  };

  const renderViewToggle = () => (
    <View style={styles.viewToggle}>
      {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
        <Pressable
          key={mode}
          style={[styles.toggleBtn, viewMode === mode && styles.toggleBtnActive]}
          onPress={() => { hapticSelection(); setViewMode(mode); }}
        >
          <Text style={[styles.toggleText, viewMode === mode && styles.toggleTextActive]}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderNavigation = () => (
    <View style={styles.monthNav}>
      <Pressable style={styles.navArrow} onPress={goToPrev}>
        <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
      </Pressable>
      <Text style={styles.monthTitle}>{getHeaderTitle()}</Text>
      <Pressable style={styles.navArrow} onPress={goToNext}>
        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
      </Pressable>
    </View>
  );

  const renderMonthView = () => (
    <Animated.View entering={FadeInDown.duration(300)}>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }
          const dayTripList = getTripsForDay(day, currentMonth, currentYear, tripsData);
          const isToday = isCurrentMonth && day === todayDate;
          const isSelected = day === selectedDay;
          return (
            <Pressable
              key={day}
              onPress={() => { hapticLight(); setSelectedDay(day); }}
              style={[
                styles.dayCell,
                isToday && styles.todayCell,
                isSelected && !isToday && styles.selectedCell,
              ]}
            >
              <Text style={[styles.dayText, isToday && styles.todayText, isSelected && !isToday && styles.selectedText]}>
                {day}
              </Text>
              {dayTripList.length > 0 && (
                <View style={styles.eventDots}>
                  {dayTripList.slice(0, 3).map((trip, i) => (
                    <View
                      key={`trip-${i}`}
                      style={[styles.eventDot, { backgroundColor: STATUS_COLORS[trip.status] || '#9CA3AF' }]}
                    />
                  ))}
                  {dayTripList.length > 3 && (
                    <Text style={styles.moreDotsText}>+{dayTripList.length - 3}</Text>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      {renderDayDetailPanel(selectedTrips, `${MONTH_NAMES[currentMonth].toUpperCase()} ${selectedDay}`)}
    </Animated.View>
  );

  const renderWeekView = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let completedCount = 0;
    let activeCount = 0;
    weekDates.forEach((d) => {
      const t = getTripsForDay(d.getDate(), d.getMonth(), d.getFullYear(), tripsData);
      t.forEach((trip) => {
        if (trip.status === 'COMPLETED') completedCount++;
        if (trip.status === 'ON_DUTY' || trip.status === 'ASSIGNED') activeCount++;
      });
    });

    return (
      <Animated.View entering={FadeInDown.duration(300)}>
        <View style={styles.weekStats}>
          <View style={styles.weekStatItem}>
            <Text style={[styles.weekStatNumber, { color: STATUS_COLORS.COMPLETED }]}>{completedCount}</Text>
            <Text style={styles.weekStatLabel}>Completed</Text>
          </View>
          <View style={styles.weekStatDivider} />
          <View style={styles.weekStatItem}>
            <Text style={[styles.weekStatNumber, { color: STATUS_COLORS.ON_DUTY }]}>{activeCount}</Text>
            <Text style={styles.weekStatLabel}>Active</Text>
          </View>
        </View>
        <View style={styles.weekGrid}>
          <View style={styles.weekHeaderRow}>
            {weekDates.map((d, i) => {
              const isToday = d.getTime() === today.getTime();
              return (
                <View key={i} style={styles.weekHeaderCell}>
                  <Text style={[styles.weekDayName, isToday && styles.weekDayNameToday]}>
                    {WEEKDAYS[i]}
                  </Text>
                  <View style={[styles.weekDayNum, isToday && styles.weekDayNumToday]}>
                    <Text style={[styles.weekDayNumText, isToday && styles.weekDayNumTextToday]}>
                      {d.getDate()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.weekBodyRow}>
            {weekDates.map((d, colIdx) => {
              const dayTripList = getTripsForDay(d.getDate(), d.getMonth(), d.getFullYear(), tripsData);
              return (
                <View key={colIdx} style={styles.weekBodyCell}>
                  {dayTripList.length > 0 ? (
                    dayTripList.map((trip, i) => (
                      <Pressable
                        key={trip.id}
                        style={[
                          styles.weekTripBar,
                          { backgroundColor: (STATUS_COLORS[trip.status] || '#9CA3AF') + '20', borderLeftColor: STATUS_COLORS[trip.status] || '#9CA3AF' },
                        ]}
                      >
                        <Text style={[styles.weekTripGuest, { color: STATUS_COLORS[trip.status] }]} numberOfLines={1}>
                          {(trip.guestName || '').split(' ')[0]}
                        </Text>
                        <Text style={styles.weekTripTime} numberOfLines={1}>
                          {trip.time || ''}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <View style={styles.weekEmptyCell} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const isToday =
      dayRefDate.getFullYear() === now.getFullYear() &&
      dayRefDate.getMonth() === now.getMonth() &&
      dayRefDate.getDate() === now.getDate();
    const hourWidth = 60;
    const timelineWidth = 24 * hourWidth;

    return (
      <Animated.View entering={FadeInDown.duration(300)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTimelineScroll}>
          <View style={[styles.dayTimeline, { width: timelineWidth }]}>
            <View style={styles.dayHourRow}>
              {hours.map((h) => (
                <View key={h} style={[styles.dayHourMark, { width: hourWidth }]}>
                  <Text style={styles.dayHourText}>{String(h).padStart(2, '0')}:00</Text>
                </View>
              ))}
            </View>
            <View style={styles.dayGridLines}>
              {hours.map((h) => (
                <View key={h} style={[styles.dayGridLine, { left: h * hourWidth }]} />
              ))}
            </View>
            {isToday && (
              <View style={[styles.currentTimeIndicator, { left: currentHour * hourWidth }]}>
                <View style={styles.currentTimeDot} />
                <View style={styles.currentTimeLine} />
              </View>
            )}
            <View style={styles.dayTripsContainer}>
              {dayTrips.map((trip, i) => {
                const start = parseTime(trip.time || '00:00');
                const dur = parseDuration(trip.duration || '1h');
                const color = STATUS_COLORS[trip.status] || '#9CA3AF';
                const from = trip.from || trip.pickupLocation || '';
                const to = trip.to || trip.dropLocation || '';
                return (
                  <Pressable
                    key={trip.id}
                    style={[
                      styles.dayTripBar,
                      {
                        left: start * hourWidth,
                        width: Math.max(dur * hourWidth, hourWidth * 0.5),
                        backgroundColor: color + '30',
                        borderLeftColor: color,
                        top: i * 56,
                      },
                    ]}
                  >
                    <Text style={[styles.dayTripGuest, { color }]} numberOfLines={1}>
                      {trip.guestName}
                    </Text>
                    <Text style={styles.dayTripRoute} numberOfLines={1}>
                      {from} → {to}
                    </Text>
                    <Text style={styles.dayTripMeta}>
                      {trip.time} · {trip.distance || ''} · {trip.driver || ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
        {renderDayDetailPanel(
          dayTrips,
          `${SHORT_MONTH_NAMES[dayRefDate.getMonth()].toUpperCase()} ${dayRefDate.getDate()}`,
        )}
      </Animated.View>
    );
  };

  const renderDayDetailPanel = (tripList: Trip[], label: string) => (
    <View style={styles.eventsSection}>
      <Text style={styles.eventsTitle}>TRIPS FOR {label}</Text>
      {tripList.length > 0 ? (
        tripList.map((trip) => {
          const statusColor = STATUS_COLORS[trip.status] || '#9CA3AF';
          const from = trip.from || trip.pickupLocation || '';
          const to = trip.to || trip.dropLocation || '';
          return (
            <Pressable key={trip.id} style={styles.eventCard}>
              <View style={[styles.eventStatusDot, { backgroundColor: statusColor }]} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{trip.title || trip.guestName || 'Trip'}</Text>
                <Text style={styles.eventRoute}>
                  {from} → {to}
                </Text>
                <View style={styles.eventMetaRow}>
                  <Ionicons name="time-outline" size={12} color={colors.text.tertiary} />
                  <Text style={styles.eventTime}>{trip.time || ''}</Text>
                  <Ionicons name="person-outline" size={12} color={colors.text.tertiary} style={{ marginLeft: 12 }} />
                  <Text style={styles.eventTime}>{trip.guestName}</Text>
                </View>
                <View style={styles.eventMetaRow}>
                  <Ionicons name="car-outline" size={12} color={colors.text.tertiary} />
                  <Text style={styles.eventTime}>{trip.driver || 'Pending'}</Text>
                  <Ionicons name="navigate-outline" size={12} color={colors.text.tertiary} style={{ marginLeft: 12 }} />
                  <Text style={styles.eventTime}>{trip.distance || ''}</Text>
                </View>
              </View>
              <View style={styles.eventRight}>
                <Text style={styles.eventAmount}>{formatCurrency(trip.amount || trip.totalAmount || 0)}</Text>
                <View style={[styles.eventStatusBadge, { backgroundColor: statusColor + '18' }]}>
                  <Text style={[styles.eventStatusText, { color: statusColor }]}>
                    {STATUS_LABELS[trip.status] || trip.status}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })
      ) : (
        <View style={styles.noEvents}>
          <Ionicons name="calendar-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.noEventsText}>No trips for this day</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <TabScreenTransition tabIndex={2}>
        <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[typography.body, { color: colors.text.tertiary, marginTop: spacing.md }]}>Loading calendar...</Text>
        </View>
      </TabScreenTransition>
    );
  }

  return (
    <TabScreenTransition tabIndex={2}>
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 80, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchTrips(); }}
            tintColor={colors.accent.primary}
          />
        }
      >
        {renderViewToggle()}
        {renderNavigation()}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </ScrollView>

      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Calendar</Text>
          <Pressable style={styles.todayBtn} onPress={goToToday}>
            <Ionicons name="today-outline" size={16} color={colors.text.inverse} />
            <Text style={styles.todayBtnText}>Today</Text>
          </Pressable>
        </View>
      </View>
    </View>
    </TabScreenTransition>
  );
}

const createStyles = (colors: any, shadows: any, isDark: boolean) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg.base },
    container: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },

    header: {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: colors.bg.base,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    title: { ...typography.h3, color: colors.text.primary, fontWeight: '700', flex: 1 },
    todayBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      backgroundColor: colors.accent.primary, borderRadius: radius.sm,
    },
    todayBtnText: { ...typography.caption, color: colors.text.inverse, fontWeight: '600' },

    viewToggle: {
      flexDirection: 'row', backgroundColor: colors.bg.surface, borderRadius: radius.md,
      padding: 3, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border.subtle,
    },
    toggleBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
    toggleBtnActive: { backgroundColor: colors.accent.primary },
    toggleText: { ...typography.caption, color: colors.text.secondary, fontWeight: '600' },
    toggleTextActive: { color: colors.text.inverse },

    monthNav: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      marginBottom: spacing.lg, gap: spacing.lg,
    },
    navArrow: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg.surface,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border.subtle,
    },
    monthTitle: { ...typography.h3, color: colors.text.primary, fontWeight: '600', minWidth: 160, textAlign: 'center' },

    weekdayRow: { flexDirection: 'row', marginBottom: spacing.sm },
    weekdayCell: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
    weekdayText: { ...typography.caption, color: colors.text.tertiary, fontWeight: '600' },

    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
    dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xs },
    todayCell: { backgroundColor: colors.accent.primary, borderRadius: radius.full },
    selectedCell: { borderWidth: 2, borderColor: colors.accent.primary, borderRadius: radius.full },
    dayText: { ...typography.body, color: colors.text.primary },
    todayText: { color: colors.text.inverse, fontWeight: '700' },
    selectedText: { color: colors.accent.primary, fontWeight: '700' },
    eventDots: { flexDirection: 'row', gap: 2, marginTop: 2, alignItems: 'center' },
    eventDot: { width: 5, height: 5, borderRadius: 3 },
    moreDotsText: { fontSize: 8, color: colors.text.tertiary, marginLeft: 1 },

    weekStats: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl,
      marginBottom: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.bg.surface,
      borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.subtle,
    },
    weekStatItem: { alignItems: 'center' },
    weekStatNumber: { ...typography.statSmall, fontWeight: '700' },
    weekStatLabel: { ...typography.caption, color: colors.text.tertiary, marginTop: 2 },
    weekStatDivider: { width: 1, height: 32, backgroundColor: colors.border.subtle },
    weekGrid: { marginBottom: spacing.lg },
    weekHeaderRow: { flexDirection: 'row', marginBottom: spacing.sm },
    weekHeaderCell: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
    weekDayName: { ...typography.tiny, color: colors.text.tertiary, marginBottom: 4 },
    weekDayNameToday: { color: colors.accent.primary },
    weekDayNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    weekDayNumToday: { backgroundColor: colors.accent.primary },
    weekDayNumText: { ...typography.caption, color: colors.text.primary, fontWeight: '600' },
    weekDayNumTextToday: { color: colors.text.inverse },
    weekBodyRow: { flexDirection: 'row' },
    weekBodyCell: { flex: 1, paddingHorizontal: 2, gap: 4, minHeight: 80 },
    weekTripBar: { paddingVertical: 4, paddingHorizontal: 4, borderRadius: 4, borderLeftWidth: 3, marginBottom: 3 },
    weekTripGuest: { ...typography.tiny, fontWeight: '600' },
    weekTripTime: { fontSize: 9, color: colors.text.tertiary },
    weekEmptyCell: { flex: 1 },

    dayTimelineScroll: { marginBottom: spacing.lg },
    dayTimeline: { minHeight: 200, position: 'relative' },
    dayHourRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
    dayHourMark: { paddingVertical: spacing.sm, alignItems: 'center' },
    dayHourText: { fontSize: 10, color: colors.text.tertiary },
    dayGridLines: { position: 'absolute', top: 30, bottom: 0, left: 0, right: 0 },
    dayGridLine: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: colors.border.subtle },
    currentTimeIndicator: { position: 'absolute', top: 28, zIndex: 10 },
    currentTimeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginLeft: -4 },
    currentTimeLine: { width: 2, height: 120, backgroundColor: '#EF4444', marginLeft: -3 },
    dayTripsContainer: { position: 'relative', marginTop: 8, minHeight: 120 },
    dayTripBar: { position: 'absolute', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, borderLeftWidth: 3, minHeight: 48 },
    dayTripGuest: { ...typography.caption, fontWeight: '600' },
    dayTripRoute: { fontSize: 10, color: colors.text.secondary },
    dayTripMeta: { fontSize: 9, color: colors.text.tertiary, marginTop: 2 },

    eventsSection: { marginTop: spacing.md },
    eventsTitle: { ...typography.label, color: colors.text.tertiary, marginBottom: spacing.md },
    eventCard: {
      flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.bg.surface,
      borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md,
      borderWidth: 1, borderColor: colors.border.subtle,
      ...(!isDark ? shadows.low : {}),
    },
    eventStatusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
    eventInfo: { flex: 1 },
    eventName: { ...typography.bodyMedium, color: colors.text.primary },
    eventRoute: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
    eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    eventTime: { ...typography.caption, color: colors.text.tertiary },
    eventRight: { alignItems: 'flex-end', gap: 6 },
    eventAmount: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },
    eventStatusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
    eventStatusText: { ...typography.tiny, fontWeight: '600', textTransform: 'uppercase' },
    noEvents: {
      alignItems: 'center', padding: spacing.xxl, backgroundColor: colors.bg.surface,
      borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.subtle,
    },
    noEventsText: { ...typography.body, color: colors.text.tertiary, marginTop: spacing.sm },
  });
