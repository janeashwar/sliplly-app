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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
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
const GRADIENT_HEIGHT = 160;
const BOTTOM_OFFSET = 12;

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
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
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
        <View style={[styles.sideButton, { borderColor }]}>
          {/* LAYER 1: Empty BlurView */}
          <BlurView
            intensity={isDark ? 15 : 40}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          {/* LAYER 2: Content in separate hardware layer */}
          <View 
            style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 10 }]} 
            collapsable={false}
            pointerEvents="box-none"
          >
            <Ionicons name="menu-outline" size={20} color={iconColor} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Add Button ────────────────────────────────────────────────────
function AddButton({ isDark, isBookingPage, onNavigate }: { isDark: boolean; isBookingPage: boolean; onNavigate: (route: string) => void }) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(isBookingPage ? 45 : 0);
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

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
        <View style={[styles.sideButton, { borderColor }]}>
          {/* LAYER 1: Blur background - stays in place */}
          <BlurView
            intensity={isDark ? 15 : 40}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          {/* LAYER 2: Icon - rotates independently */}
          <Animated.View 
            style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 10 }, iconStyle]} 
            collapsable={false}
            pointerEvents="box-none"
          >
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
    // Only update slider for main tabs, not booking
    if (activeRouteName !== 'booking') {
      // Stretch horizontally, squeeze vertically
      sliderScaleX.value = withSpring(1.15, { stiffness: 400, damping: 15, mass: 0.5 });
      sliderScaleY.value = withSpring(0.85, { stiffness: 400, damping: 15, mass: 0.5 });
      
      setTimeout(() => {
        // Return to normal
        sliderScaleX.value = withSpring(1, { stiffness: 300, damping: 20, mass: 0.8 });
        sliderScaleY.value = withSpring(1, { stiffness: 300, damping: 20, mass: 0.8 });
      }, 100);
      
      lastTabIndex.current = newIndex;
    }
    sliderX.value = withSpring(lastTabIndex.current, SPRING.slider);
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
    router.push(`/(tabs)/${tabName}`);
  }, [router]);

  const handleNavigate = useCallback((route: string) => {
    if (route === 'back') router.back();
    else router.push(`/(tabs)/${route}`);
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

  // Gradient fade animation for booking page (separate from nav bar)
  const gradientOpacity = useSharedValue(1);
  useEffect(() => {
    gradientOpacity.value = withTiming(
      isBookingPage ? 0 : 1,
      { duration: 300 }
    );
  }, [isBookingPage]);

  const gradientStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  }));

  // Gradient colors - always show, but animate opacity
  const gradientColors: [string, string, string, string, string, string] = isDark
    ? ['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.85)']
    : ['transparent', 'rgba(0,0,0,0.02)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.18)'];

  const activeColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const inactiveColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(28,28,30,0.4)';
  // Slider colors - premium for each theme
  const sliderBg = isDark ? '#2A2A2A' : '#FEFEFE';

  return (
    <View style={styles.container}>
      {/* Gradient from screen bottom - fades on booking page */}
      <Animated.View style={[styles.gradient, { height: insets.bottom + GRADIENT_HEIGHT }, { opacity: isBookingPage ? 0 : 1 }]}>
        <LinearGradient
          colors={gradientColors}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </Animated.View>

      {/* Navigation bar + drawer - fades on booking page */}
      <Animated.View style={[styles.navBar, { bottom: insets.bottom + BOTTOM_OFFSET }, navBarStyle]}>
        {/* Center: Pill (centered in container) */}
        <View style={styles.pillWrapper}>
          {/* Layer 1: Empty BlurView */}
          <BlurView
            intensity={isDark ? 15 : 40}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          {/* Layer 2: Border */}
          <View style={[styles.pillBorder, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
          {/* Layer 3: Opaque slider (blur won't show through) */}
          <Animated.View style={[styles.slider, sliderStyle, { backgroundColor: sliderBg }]} />
          {/* Layer 4: Tabs in separate hardware layer */}
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
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
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
  contentLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sideButton: {
    width: SIDE_BUTTON_SIZE,
    height: SIDE_BUTTON_SIZE,
    borderRadius: SIDE_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  pillWrapper: {
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
      default: {},
    }),
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
    // Premium shadow for light theme
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
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
