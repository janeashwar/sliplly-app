/**
 * PremiumBottomNav — Production-grade bottom navigation for Sliplly
 * 
 * Layout: [Drawer] [Pill with 3 tabs] [Add FAB]
 * Uses absolute positioning for side buttons, pill centered with flex:1
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';
import { useScroll } from '../context/ScrollContext';
import { hapticTap, hapticMedium } from '../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Layout constants
const BAR_MARGIN = 16;
const SIDE_BUTTON_SIZE = 44;
const PILL_HEIGHT = 52;
const PILL_PADDING = 5;
const PILL_GAP = 8;
const FAB_SIZE = 48;
const TAB_COUNT = 3;
const BOTTOM_OFFSET = 12;

// Solid opaque surfaces (no blur / no transparency)
const SURFACE_DARK = '#1C1C1E';
const SURFACE_LIGHT = '#FFFFFF';
const BORDER_DARK = '#323234';
const BORDER_LIGHT = '#E3E3E8';

// Tab width calculation - use full pill width divided by 3
const PILL_WIDTH = SCREEN_WIDTH - (BAR_MARGIN * 2) - SIDE_BUTTON_SIZE - FAB_SIZE - (PILL_GAP * 2);
const TAB_WIDTH = (PILL_WIDTH - (PILL_PADDING * 2)) / TAB_COUNT;

const SPRING = {
  press: { stiffness: 500, damping: 25, mass: 0.8 },
  slider: { stiffness: 280, damping: 26, mass: 1 },
  fab: { stiffness: 400, damping: 18, mass: 0.7 },
  rotation: { stiffness: 300, damping: 20, mass: 0.8 },
  navBar: { stiffness: 200, damping: 25, mass: 1 },
};

type TabName = 'dashboard' | 'trips' | 'calendar';

const TABS = [
  { name: 'dashboard' as TabName, icon: 'grid-outline', iconFocused: 'grid' },
  { name: 'trips' as TabName, icon: 'car-outline', iconFocused: 'car' },
  { name: 'calendar' as TabName, icon: 'calendar-outline', iconFocused: 'calendar' },
];

function getTabIndex(routeName: string): number {
  if (routeName === 'dashboard') return 0;
  if (routeName === 'trips') return 1;
  if (routeName === 'calendar') return 2;
  return 0;
}

// ─── Drawer Button ─────────────────────────────────────────────────
function DrawerButton({ isDark }: { isDark: boolean }) {
  const { openDrawer } = useDrawer();
  const scale = useSharedValue(1);
  const surfaceColor = isDark ? SURFACE_DARK : SURFACE_LIGHT;
  const borderColor = isDark ? BORDER_DARK : BORDER_LIGHT;
  // Use same colors as nav bar icons
  const iconColor = isDark ? '#FFFFFF' : '#1A1A1A';

  const handlePressIn = useCallback(() => { hapticTap(); scale.value = withSpring(0.88, SPRING.press); }, []);
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING.press);
    openDrawer();
  }, [openDrawer]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={[styles.sideButton, { backgroundColor: surfaceColor, borderColor }]}>
          <Ionicons name="menu-outline" size={20} color={iconColor} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Add Button ────────────────────────────────────────────────────
function AddButton({ isDark, isBookingPage, onNavigate }: { isDark: boolean; isBookingPage: boolean; onNavigate: (route: string) => void }) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(isBookingPage ? 45 : 0);
  const surfaceColor = isDark ? SURFACE_DARK : SURFACE_LIGHT;
  const borderColor = isDark ? BORDER_DARK : BORDER_LIGHT;

  useEffect(() => {
    rotation.value = withSpring(isBookingPage ? 45 : 0, SPRING.rotation);
  }, [isBookingPage]);

  const handlePressIn = useCallback(() => { hapticMedium(); scale.value = withSpring(0.88, SPRING.press); }, []);
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING.press);
    if (isBookingPage) onNavigate('back');
    else onNavigate('booking');
  }, [isBookingPage, onNavigate]);

  // Only scale for the button container
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Only rotation for the icon
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={buttonStyle}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={[styles.sideButton, { backgroundColor: surfaceColor, borderColor }]}>
          {/* Icon rotates independently of the button scale */}
          <Animated.View style={[styles.iconLayer, iconStyle]}>
            <Ionicons name="add-outline" size={20} color={isDark ? '#4ADE80' : '#2D8A5E'} />
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Bottom Navigation ────────────────────────────────────────
export default function PremiumBottomNav() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  
  // Get scroll context for dynamic nav bar behavior
  const { isAtBottom } = useScroll();
  
  // Get current route from pathname
  const activeRouteName = useMemo(() => {
    if (pathname.includes('dashboard')) return 'dashboard';
    if (pathname.includes('trips')) return 'trips';
    if (pathname.includes('calendar')) return 'calendar';
    if (pathname.includes('booking')) return 'booking';
    return 'dashboard';
  }, [pathname]);
  const isBookingPage = activeRouteName === 'booking';
  
  // Slider animation - keep position when on booking page
  const sliderX = useSharedValue(getTabIndex(activeRouteName));
  const sliderScaleX = useSharedValue(1);
  const sliderScaleY = useSharedValue(1);
  const lastTabIndex = useRef(getTabIndex(activeRouteName));
  
  useEffect(() => {
    const newIndex = getTabIndex(activeRouteName);
    if (activeRouteName !== 'booking') {
      if (newIndex !== lastTabIndex.current) {
        // Bouncy squash-stretch while sliding — one UI-thread chain,
        // no setTimeout (that raced the springs and flickered)
        sliderScaleX.value = withSequence(
          withTiming(1.12, { duration: 90, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) })
        );
        sliderScaleY.value = withSequence(
          withTiming(0.88, { duration: 90, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) })
        );
      }
      lastTabIndex.current = newIndex;
    }
    sliderX.value = withTiming(lastTabIndex.current, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [activeRouteName]);

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: sliderX.value * TAB_WIDTH },
      { scaleX: sliderScaleX.value },
      { scaleY: sliderScaleY.value },
    ],
  }));

  const handleTabPress = useCallback((tabName: TabName) => {
    hapticTap();
    // navigate (not push) — push creates a NEW screen instance on every tap,
    // remounting the whole tab (0.5s rebuild + replayed animations)
    router.navigate(`/(tabs)/${tabName}`);
  }, [router]);

  const handleNavigate = useCallback((route: string) => {
    if (route === 'back') router.back();
    else router.navigate(`/(tabs)/${route}`);
  }, [router]);

  // Nav bar fade animation for booking page
  const navBarOpacity = useSharedValue(1);
  useEffect(() => {
    navBarOpacity.value = withSpring(
      isBookingPage ? 0 : 1,
      { stiffness: 300, damping: 25, mass: 0.8 }
    );
  }, [isBookingPage]);

  const navBarStyle = useAnimatedStyle(() => ({
    opacity: navBarOpacity.value,
  }));

  const activeColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const inactiveColor = isDark ? '#98989F' : '#8E8E93';
  // Slider colors - premium for each theme
  const sliderBg = isDark ? '#2A2A2A' : '#FEFEFE';
  // Pill surface + border - solid opaque
  const pillBg = isDark ? SURFACE_DARK : SURFACE_LIGHT;
  const pillBorderColor = isDark ? BORDER_DARK : BORDER_LIGHT;

  return (
    <View style={styles.container}>
      {/* Navigation bar + drawer - fades on booking page */}
      <Animated.View style={[styles.navBar, { bottom: insets.bottom + BOTTOM_OFFSET }, navBarStyle]}>
        {/* Center: Pill (centered in container) */}
        <View style={[styles.pillWrapper, { backgroundColor: pillBg }]}>
          {/* Opaque slider behind the tabs */}
          <Animated.View style={[styles.slider, sliderStyle, { backgroundColor: sliderBg }]} collapsable={false} />
          {/* Subtle border on top of the surface */}
          <View style={[styles.pillBorder, { borderColor: pillBorderColor }]} />
          {/* Tabs */}
          <View style={[styles.pillTabs, { zIndex: 10 }]} collapsable={false} pointerEvents="box-none">
            {TABS.map((tab) => {
              const isActive = getTabIndex(activeRouteName) === TABS.indexOf(tab);
              return (
                <Pressable
                  key={tab.name}
                  style={styles.pillTab}
                  onPress={() => handleTabPress(tab.name)}
                >
                  {isActive ? (
                    <Animated.Text style={[styles.pillLabel, { color: activeColor }]}>
                      {tab.name.charAt(0).toUpperCase() + tab.name.slice(1)}
                    </Animated.Text>
                  ) : (
                    <Ionicons
                      name={tab.icon as any}
                      size={18}
                      color={inactiveColor}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Left: Drawer button (absolute positioned) */}
        <View style={styles.leftButton}>
          <DrawerButton isDark={isDark} />
        </View>
      </Animated.View>

      {/* Add button - vertically centered with drawer button */}
      <View style={[styles.fabPosition, { bottom: insets.bottom + BOTTOM_OFFSET + (PILL_HEIGHT - SIDE_BUTTON_SIZE) / 2, zIndex: 200 }]}>
        <AddButton isDark={isDark} isBookingPage={isBookingPage} onNavigate={handleNavigate} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  navBar: {
    position: 'absolute',
    left: BAR_MARGIN,
    right: BAR_MARGIN,
    height: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  leftButton: {
    position: 'absolute',
    left: 0,
    width: SIDE_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightButton: {
    position: 'absolute',
    right: 0,
    width: FAB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPosition: {
    position: 'absolute',
    right: BAR_MARGIN,
    width: FAB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButton: {
    width: SIDE_BUTTON_SIZE,
    height: SIDE_BUTTON_SIZE,
    borderRadius: SIDE_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    // NOTE: no elevation here — elevation + animated transforms causes
    // black-box rendering artifacts on many Android GPUs
  },
  pillWrapper: {
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    // NOTE: no elevation / overflow:hidden here — same Android artifact class
  },
  pillBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: PILL_HEIGHT / 2,
    borderWidth: 1,
    zIndex: 1,
  },
  slider: {
    position: 'absolute',
    top: PILL_PADDING,
    left: PILL_PADDING,
    width: TAB_WIDTH - (PILL_PADDING * 2),
    height: PILL_HEIGHT - (PILL_PADDING * 2),
    borderRadius: (PILL_HEIGHT - (PILL_PADDING * 2)) / 2,
    zIndex: 2,
    // NOTE: intentionally no shadow/elevation — animated scale/translate
    // on elevated views triggers black rectangles on some Android devices
  },
  pillTabs: {
    flexDirection: 'row',
    flex: 1,
    zIndex: 3,
  },
  pillTab: {
    width: TAB_WIDTH,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
