import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/components/Text';
import { useDatabaseInit } from '@/hooks/useDatabase';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  const { ready, error } = useDatabaseInit();

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text variant="title" tone="bad">No se pudo inicializar la base de datos</Text>
        <Text variant="caption" tone="secondary" style={{ marginTop: 8, textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="create-exercise"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="session"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="routine-editor"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="measurements"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="exercise/[id]" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
