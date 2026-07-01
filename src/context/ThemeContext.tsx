import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { darkColors, lightColors, darkStatusBadges, lightStatusBadges, shadows, darkSearchColors, lightSearchColors } from '../theme/colors';
import type { ThemeMode } from '../theme/colors';

const THEME_KEY = '@sliplly_theme';

type AnyColors = typeof darkColors | typeof lightColors;
type AnyStatusBadges = typeof darkStatusBadges | typeof lightStatusBadges;
type AnySearchColors = typeof darkSearchColors | typeof lightSearchColors;

interface ThemeContextType {
  mode: ThemeMode;
  colors: AnyColors;
  statusBadges: AnyStatusBadges;
  searchColors: AnySearchColors;
  shadows: typeof shadows;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: darkColors,
  statusBadges: darkStatusBadges,
  searchColors: darkSearchColors,
  shadows,
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem(THEME_KEY).then((saved: string | null) => {
        if (saved === 'light' || saved === 'dark') {
          setMode(saved);
        }
        setIsLoaded(true);
      }).catch(() => setIsLoaded(true));
    } catch {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
      } catch {}
    }
  }, [mode, isLoaded]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  const value: ThemeContextType = {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    statusBadges: mode === 'dark' ? darkStatusBadges : lightStatusBadges,
    searchColors: mode === 'dark' ? darkSearchColors : lightSearchColors,
    shadows,
    isDark: mode === 'dark',
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { ThemeContext };
