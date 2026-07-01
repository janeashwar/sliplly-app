import { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { DrawerProvider } from '../src/context/DrawerContext';
import { TabProvider } from '../src/context/TabContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { ScrollProvider } from '../src/context/ScrollContext';
import Drawer from '../src/components/Drawer';
import LoadingScreen from '../src/components/LoadingScreen';
import ToastProvider from '../src/components/Toast';
import { useAuthStore } from '../src/store/authStore';
import { OfflineBanner } from '../src/offline';
import { notificationService } from '../src/notifications';
import { initializeOfflineSystems } from '../src/api/client';
import { runAfterInteractions } from '../src/performance/interactionManager';

// Keep splash visible while loading fonts
SplashScreen.preventAutoHideAsync();

function RootContent() {
  const [isLoading, setIsLoading] = useState(true);
  const { colors, isDark } = useTheme();
  const { isAuthenticated, loadUser } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Load custom fonts
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  // Hide splash when fonts are ready
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Safety timeout — if loading screen gets stuck, force it to complete
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('[LoadingScreen] Safety timeout — forcing loading complete');
        setIsLoading(false);
      }
    }, 6000); // 6 seconds max

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Initialize offline systems and notifications after interactions
  useEffect(() => {
    const cleanup = runAfterInteractions(async () => {
      // Initialize offline-first architecture
      await initializeOfflineSystems();

      // Initialize push notifications (skip in Expo Go — SDK 53+ removed push support)
      try {
        await notificationService.initialize();
        notificationService.setTapHandler((data) => {
          if (data?.screen) {
            router.push(data.screen);
          }
        });
      } catch (e) {
        // expo-notifications not fully supported in Expo Go — expected
        console.log('[Notifications] Skipped in Expo Go');
      }
    });

    return cleanup;
  }, []);

  // Auth gate: redirect based on auth state
  useEffect(() => {
    if (isLoading) return; // Wait for splash screen

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not signed in, redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Signed in but still on auth screens, go to app
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.base }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {isLoading ? (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      ) : (
        <TabProvider>
          <ScrollProvider>
            <DrawerProvider>
              <Drawer />
              <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg.base },
                animation: 'slide_from_right',
                animationDuration: 200,
              }}
            >
              <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="vehicles" />
              <Stack.Screen name="drivers" />
              <Stack.Screen name="packages" />
              <Stack.Screen name="guests" />
              <Stack.Screen name="plans" />
              <Stack.Screen name="wallet" />
              <Stack.Screen name="profile" />
              <Stack.Screen name="trip-details" options={{ animation: 'fade' }} />
              <Stack.Screen name="finalize-charges" />
              <Stack.Screen name="invoice-preview" />
              <Stack.Screen name="guest-detail" />
              <Stack.Screen name="reviews" />
              <Stack.Screen name="offer-marketplace" />
              <Stack.Screen name="my-offers" />
              <Stack.Screen name="user-management" />
              <Stack.Screen name="send-notification" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="reports" />
              <Stack.Screen name="two-factor-setup" />
            </Stack>
            </DrawerProvider>
          </ScrollProvider>
        </TabProvider>
      )}

      {/* Offline status banner — shows when disconnected */}
      <OfflineBanner />

      {/* Toast notifications — renders above everything */}
      <ToastProvider isDark={isDark} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
