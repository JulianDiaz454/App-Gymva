import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/components/Text';
import { ToastHost } from '@/components/Toast';
import { useDatabaseInit } from '@/hooks/useDatabase';
import { colors } from '@/theme/tokens';

// Fija el fondo nativo de la ventana antes incluso del primer render: evita el
// flash blanco entre transiciones de pantalla (cuando React cambia de escena
// pero el sistema todavía no pintó la siguiente).
SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});

export default function RootLayout() {
  const { ready, error } = useDatabaseInit();

  // Refuerza el color por si el async previo no se aplicó a tiempo.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
  }, []);

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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            // navigationBarColor evita franja blanca en Android al volver atrás
            navigationBarColor: colors.bg,
            animation: 'slide_from_right',
            // Fondo de la transición (Android): elimina el flash blanco entre escenas
            animationMatchesGesture: true,
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
          <Stack.Screen name="routines" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen
            name="routine-editor"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="measurements"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="photos" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="exercise/[id]" options={{ animation: 'slide_from_right' }} />
        </Stack>
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
