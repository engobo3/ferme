import '../services/emulator'; // must run before any other Firebase usage

import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';
import 'react-native-reanimated';

import { colors, t } from '@diaspora-trust/shared-ui';
import { LoginScreen } from '../components/LoginScreen';

export const unstable_settings = {
  anchor: '(tabs)',
};

/** Light-only navigation theme built on the shared design tokens. */
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <ThemeProvider value={AppTheme}>
        <LoginScreen />
        <StatusBar style="dark" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={AppTheme}>
      <Stack
        screenOptions={{
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.surface },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="task/[id]" options={{ title: t('task.detail') }} />
        <Stack.Screen name="material/[id]" options={{ title: 'Suivi du matériau' }} />
        <Stack.Screen name="request-funds" options={{ title: t('tools.requestFunds') }} />
        <Stack.Screen name="walk-measure" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="crop-scan" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="record-witness" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
