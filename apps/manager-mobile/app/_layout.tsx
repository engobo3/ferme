import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { colors, t } from '@diaspora-trust/shared-ui';

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
