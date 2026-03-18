import 'react-native-gesture-handler';
import { DarkTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PackTokensProvider } from '@/lib/theme/PackTokensContext';
import { SubscriptionProvider } from '@/lib/subscription/SubscriptionContext';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

function RootLayoutNav() {
  const [ready, setReady] = useState(false);
  const didHide = useRef(false);

  useEffect(() => {
    const hideSplash = () => {
      if (didHide.current) return;
      didHide.current = true;
      SplashScreen.hideAsync().catch(() => {});
      setReady(true);
    };

    // Failsafe: hide splash after 2.5s regardless of provider init
    const failsafe = setTimeout(hideSplash, 2500);

    // Expo Router signals readiness via its own internal mechanism;
    // we just need the failsafe to cover cases where it never fires.
    hideSplash();

    return () => clearTimeout(failsafe);
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#555555', fontSize: 13 }}>Loading…</Text>
      </View>
    );
  }

  return (
    <NavThemeProvider value={DarkTheme}>
      <ThemeProvider>
        <PackTokensProvider>
        <SubscriptionProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="tool-list"
            options={{
              headerShown: false,
              presentation: 'formSheet',
              sheetAllowedDetents: [1.0],
              sheetGrabberVisible: false,
            }}
          />
          <Stack.Screen
            name="editor"
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name="search"
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name="themes"
            options={{
              headerShown: false,
              presentation: 'formSheet',
              sheetAllowedDetents: [0.7],
              sheetGrabberVisible: true,
            }}
          />
          <Stack.Screen
            name="export-panel"
            options={{
              headerShown: false,
              presentation: 'formSheet',
              sheetAllowedDetents: [0.5],
              sheetGrabberVisible: true,
            }}
          />
          <Stack.Screen
            name="activity"
            options={{
              headerShown: false,
              presentation: 'formSheet',
              sheetAllowedDetents: [0.65],
              sheetGrabberVisible: true,
            }}
          />
          <Stack.Screen
            name="canvas"
            options={{ headerShown: false, presentation: 'card' }}
          />
          <Stack.Screen
            name="scan-preview"
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name="vault"
            options={{ headerShown: false, presentation: 'card' }}
          />
          <Stack.Screen
            name="journal"
            options={{ headerShown: false, presentation: 'card' }}
          />
          <Stack.Screen
            name="goals"
            options={{ headerShown: false, presentation: 'card' }}
          />
          <Stack.Screen
            name="command-bar"
            options={{ headerShown: false, presentation: 'transparentModal', animation: 'fade' }}
          />
          <Stack.Screen
            name="theme-qa"
            options={{ headerShown: false, presentation: 'card' }}
          />
          <Stack.Screen
            name="calendar"
            options={{ headerShown: false, presentation: 'card' }}
          />
          <Stack.Screen
            name="meeting-detail"
            options={{ headerShown: false, presentation: 'card' }}
          />
          <Stack.Screen
            name="vault-os"
            options={{ headerShown: false, presentation: 'card' }}
          />
          <Stack.Screen
            name="vault-note"
            options={{ headerShown: false, presentation: 'card' }}
          />
          <Stack.Screen
            name="vault-context-packs"
            options={{ headerShown: false, presentation: 'card' }}
          />
          <Stack.Screen
            name="vault-generators"
            options={{ headerShown: false, presentation: 'card' }}
          />
          <Stack.Screen
            name="paywall"
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name="desk-setup"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="first-launch"
            options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }}
          />
        </Stack>
        </SubscriptionProvider>
      </PackTokensProvider>
      </ThemeProvider>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <StatusBar style="light" />
          <RootLayoutNav />
        </ErrorBoundary>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
