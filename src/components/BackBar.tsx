import { router } from 'expo-router';
import { type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackIcon } from '@/components/AppIcons';
import { IconButton } from '@/components/IconButton';
import { colors } from '@/theme/tokens';

interface Props {
  onPress?: () => void;
  right?: ReactNode;
  title?: string;
}

/**
 * Barra superior con botón "volver". Aplica SafeArea top para que el botón
 * no quede debajo de la barra de estado en pantallas que pintan su propio header.
 * Layout: [< ] (espacio) [right]. Si title se provee, se centra entre los dos lados.
 */
export function BackBar({ onPress, right, title }: Props) {
  const handle = onPress ?? (() => router.back());
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
      >
        <IconButton onPress={handle} accessibilityLabel="Volver">
          <BackIcon size={18} color={colors.text} />
        </IconButton>
        {title ? (
          <View style={{ flex: 1, alignItems: 'center' }}>
            {/* el caller pone el Text si lo necesita */}
          </View>
        ) : null}
        {right ?? <View style={{ width: 44 }} />}
      </View>
    </SafeAreaView>
  );
}
