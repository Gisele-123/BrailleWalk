import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { VoiceProvider } from '../context/VoiceContext';
import { NavigationProvider } from '../context/NavigationContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ErrorBoundary>
      <VoiceProvider>
        <NavigationProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="light" />
        </NavigationProvider>
      </VoiceProvider>
    </ErrorBoundary>
  );
}