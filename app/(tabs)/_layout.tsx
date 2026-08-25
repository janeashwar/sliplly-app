import { Tabs } from 'expo-router/tabs';
import { useTheme } from '../../src/context/ThemeContext';
import PremiumBottomNav from '../../src/components/PremiumBottomNav';
import { usePathname, useRouter } from 'expo-router';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { AnimatedTabView } from '../../src/components/AnimatedTabView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

// Tab order for transition direction
const TAB_ORDER = ['dashboard', 'trips', 'calendar', 'more'];

function getTabIndex(pathname: string): number {
  for (let i = 0; i < TAB_ORDER.length; i++) {
    if (pathname.includes(TAB_ORDER[i])) return i;
  }
  return 0;
}

function SwipeableTabContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentIndex = useMemo(() => getTabIndex(pathname), [pathname]);
  const translateX = useSharedValue(0);
  const isSwiping = useSharedValue(false);

  const navigateToTab = useCallback(
    (direction: 'left' | 'right') => {
      const newIndex = direction === 'left' ? currentIndex + 1 : currentIndex - 1;
      if (newIndex >= 0 && newIndex < TAB_ORDER.length) {
        router.push(`/(tabs)/${TAB_ORDER[newIndex]}`);
      }
    },
    [currentIndex, router]
  );

  const panGesture = Gesture.Pan()
    .activeOffsetX([-SWIPE_THRESHOLD, SWIPE_THRESHOLD])
    .failOffsetY([-20, 20])
    .onStart(() => {
      isSwiping.value = true;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX * 0.3; // damped movement
    })
    .onEnd((event) => {
      isSwiping.value = false;
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        if (event.translationX < 0 && currentIndex < TAB_ORDER.length - 1) {
          runOnJS(navigateToTab)('left');
        } else if (event.translationX > 0 && currentIndex > 0) {
          runOnJS(navigateToTab)('right');
        }
      }
      translateX.value = withSpring(0, { stiffness: 300, damping: 30 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

export default function TabLayout() {
  const pathname = usePathname();
  const { colors } = useTheme();
  const currentIndex = useMemo(() => getTabIndex(pathname), [pathname]);
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  const [direction, setDirection] = useState<'left' | 'right' | 'none'>('none');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (currentIndex !== prevIndex) {
      const newDirection = currentIndex > prevIndex ? 'left' : 'right';
      setDirection(newDirection);
      setIsTransitioning(true);
    }
  }, [currentIndex, prevIndex]);

  const handleAnimationEnd = useCallback(() => {
    setIsTransitioning(false);
    setPrevIndex(currentIndex);
  }, [currentIndex]);

  return (
    <Tabs
      tabBar={() => <PremiumBottomNav />}
      screenOptions={{
        headerShown: false,
        animation: 'none',
        sceneStyle: { backgroundColor: colors.bg.base },
      }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="trips" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
