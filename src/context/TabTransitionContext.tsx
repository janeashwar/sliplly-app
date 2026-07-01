import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';

interface TabTransitionContextType {
  currentTab: number;
  direction: 'left' | 'right' | 'none';
  progress: SharedValue<number>;
  changeTab: (newTab: number) => void;
  isTransitioning: boolean;
}

const TabTransitionContext = createContext<TabTransitionContextType | undefined>(undefined);

export function TabTransitionProvider({ children }: { children: ReactNode }) {
  const [currentTab, setCurrentTab] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | 'none'>('none');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const progress = useSharedValue(0);

  const changeTab = useCallback((newTab: number) => {
    if (newTab === currentTab || isTransitioning) return;

    const dir = newTab > currentTab ? 'right' : 'left';
    setDirection(dir);
    setIsTransitioning(true);

    // Animate out, then switch tab
    progress.value = withTiming(1, {
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }, () => {
      runOnJS(() => {
        setCurrentTab(newTab);
        progress.value = 0;
        setIsTransitioning(false);
        setDirection('none');
      })();
    });
  }, [currentTab, isTransitioning]);

  return (
    <TabTransitionContext.Provider
      value={{ currentTab, direction, progress, changeTab, isTransitioning }}
    >
      {children}
    </TabTransitionContext.Provider>
  );
}

export function useTabTransition() {
  const context = useContext(TabTransitionContext);
  if (!context) {
    throw new Error('useTabTransition must be used within TabTransitionProvider');
  }
  return context;
}

// Wrapper for tab screen content — animates on mount/unmount
export function TabScreenWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { direction, progress } = useTabTransition();

  const animatedStyle = useAnimatedStyle(() => {
    if (direction === 'none') {
      return { opacity: 1, transform: [{ translateX: 0 }] };
    }

    // Fade in + slide from direction
    const startX = direction === 'right' ? 300 : -300;
    return {
      opacity: 1,
      transform: [
        { translateX: (1 - progress.value) * startX * 0.3 },
      ],
    };
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
