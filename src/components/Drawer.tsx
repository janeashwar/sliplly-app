import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  BackHandler,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';
import { useTabContext } from '../context/TabContext';
import { useRouter, usePathname } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.82;

const SPRING_CONFIG = {
  stiffness: 280,
  damping: 25,
  mass: 0.8,
  overshootClamping: false,
};

const SPRING_CONFIG_FAST = {
  stiffness: 350,
  damping: 28,
  mass: 0.7,
  overshootClamping: false,
};

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: string;
  tabIndex?: number;
  comingSoon?: boolean;
}

// Separator indices: after Dashboard+Trips (index 1), after Drivers (index 4), after Wallet (index 7), after My Offers (index 11)
const SEPARATOR_AFTER = new Set([1, 4, 7, 11]);

const MENU_ITEMS: MenuItem[] = [
  { icon: 'grid-outline', label: 'Dashboard', route: '/(tabs)', tabIndex: 0 },
  { icon: 'car-outline', label: 'Trips', route: '/(tabs)', tabIndex: 1 },
  { icon: 'person-outline', label: 'Guests', route: '/guests' },
  { icon: 'car-sport-outline', label: 'Vehicles', route: '/vehicles' },
  { icon: 'people-outline', label: 'Drivers', route: '/drivers' },
  { icon: 'cube-outline', label: 'Packages', route: '/packages' },
  { icon: 'pricetag-outline', label: 'Plans', route: '/plans' },
  { icon: 'wallet-outline', label: 'Wallet', route: '/wallet' },
  { icon: 'bar-chart-outline', label: 'Reports', route: '/reports' },
  { icon: 'star-outline', label: 'Reviews', route: '/reviews' },
  { icon: 'megaphone-outline', label: 'Offers', route: '/offer-marketplace' },
  { icon: 'gift-outline', label: 'My Offers', route: '/my-offers' },
  { icon: 'people-circle-outline', label: 'Users', route: '/user-management' },
  { icon: 'settings-outline', label: 'Settings', route: '/settings' },
  { icon: 'person-circle-outline', label: 'Profile', route: '/profile' },
];

export default function Drawer() {
  const insets = useSafeAreaInsets();
  const { isOpen, closeDrawer } = useDrawer();
  const { activeTabIndex, setActiveTab } = useTabContext();
  const router = useRouter();
  const pathname = usePathname();
  const progress = useSharedValue(0);
  const [shouldRender, setShouldRender] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      progress.value = withSpring(1, SPRING_CONFIG);
    } else if (shouldRender) {
      progress.value = withSpring(0, SPRING_CONFIG_FAST, (finished) => {
        'worklet';
        if (finished) {
          runOnJS(setShouldRender)(false);
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isOpen) {
        closeDrawer();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isOpen, closeDrawer]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-DRAWER_WIDTH, 0], Extrapolation.CLAMP) },
    ],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.5], Extrapolation.CLAMP),
  }));

  // Check if a non-tab route is currently active
  const isNonTabRouteActive = (): boolean => {
    const nonTabRoutes = ['/guests', '/vehicles', '/drivers', '/packages', '/plans', '/wallet', '/profile', '/settings'];
    return nonTabRoutes.some(route => pathname.includes(route));
  };

  const isActiveRoute = (item: MenuItem): boolean => {
    // For tab routes, only show active if we're on a tab page (not a non-tab page)
    if (item.tabIndex !== undefined) {
      // If we're on a non-tab route, don't highlight any tab
      if (isNonTabRouteActive()) return false;
      return activeTabIndex === item.tabIndex;
    }
    
    // For non-tab routes, check pathname
    if (!item.route) return false;
    return pathname.includes(item.route);
  };

  const handleNavigate = (item: MenuItem) => {
    if (item.comingSoon) return;
    closeDrawer();
    
    if (item.tabIndex !== undefined) {
      setActiveTab(item.tabIndex);
    } else if (item.route) {
      // Small delay to let drawer close first
      setTimeout(() => {
        // navigate — for tab routes this switches without remounting
        router.navigate(item.route as any);
      }, 100);
    }
  };

  if (!shouldRender) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={closeDrawer}>
        <Animated.View style={[styles.overlay, overlayStyle, { backgroundColor: colors.text.inverse }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.drawer, drawerStyle, { paddingTop: insets.top + spacing.lg, backgroundColor: colors.bg.elevated, borderRightColor: colors.border.default }]}>
        <View style={[styles.profileCard, { borderBottomColor: colors.border.default }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent.primary }]}>
            <Text style={[styles.avatarText, { color: colors.text.inverse }]}>J</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text.primary }]}>Janeshwar</Text>
            <Text style={[styles.profileEmail, { color: colors.text.tertiary }]}>janeshwar@sliplly.com</Text>
          </View>
        </View>

        <View style={styles.menuList}>
          {MENU_ITEMS.map((item, index) => {
            const isActive = isActiveRoute(item);
            return (
              <View key={item.label}>
                <Pressable
                  style={[
                    styles.menuItem,
                    isActive && [styles.menuItemActive, { backgroundColor: colors.accent.dim, borderLeftColor: colors.accent.primary }],
                    item.comingSoon && styles.menuItemDisabled,
                  ]}
                  onPress={() => handleNavigate(item)}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isActive ? colors.accent.primary : item.comingSoon ? colors.text.tertiary : colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.menuLabel,
                      { color: colors.text.primary },
                      isActive && [styles.menuLabelActive, { color: colors.accent.primary }],
                      item.comingSoon && { color: colors.text.tertiary },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.comingSoon ? (
                    <View style={[styles.comingSoonBadge, { backgroundColor: colors.accent.dim }]}>
                      <Text style={[styles.comingSoonText, { color: colors.accent.primary }]}>Soon</Text>
                    </View>
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={isActive ? colors.accent.primary : colors.text.tertiary}
                    />
                  )}
                </Pressable>
                {SEPARATOR_AFTER.has(index) && <View style={[styles.separator, { backgroundColor: colors.border.default }]} />}
              </View>
            );
          })}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, borderTopColor: colors.border.default }]}>
          <Text style={[styles.footerText, { color: colors.text.tertiary }]}>Sliplly v1.0.0</Text>
        </View>
      </Animated.View>
    </View>
  );
}

export function DrawerMainScreen({ children }: { children: React.ReactNode }) {
  const { isOpen } = useDrawer();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      progress.value = withSpring(1, SPRING_CONFIG);
    } else {
      progress.value = withSpring(0, SPRING_CONFIG_FAST);
    }
  }, [isOpen]);

  const mainStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, DRAWER_WIDTH * 0.6], Extrapolation.CLAMP) },
      { scale: interpolate(progress.value, [0, 1], [1, 0.88], Extrapolation.CLAMP) },
    ],
    borderRadius: interpolate(progress.value, [0, 1], [0, 24], Extrapolation.CLAMP),
    overflow: 'hidden',
  }));

  return (
    <Animated.View style={[{ flex: 1 }, mainStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 1001,
    borderRightWidth: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    paddingBottom: spacing.lg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  profileName: {
    ...typography.h3,
    fontWeight: '700',
  },
  profileEmail: {
    ...typography.caption,
    marginTop: 2,
  },
  menuList: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm + 2,
  },
  menuItemActive: {
    borderLeftWidth: 3,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuLabel: {
    ...typography.body,
    fontSize: 14,
    flex: 1,
  },
  menuLabelActive: {
    fontWeight: '700',
  },
  comingSoonBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  comingSoonText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  footerText: {
    ...typography.caption,
    fontSize: 11,
  },
});
