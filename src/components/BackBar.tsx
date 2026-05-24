import { type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackIcon } from '@/components/AppIcons';
import { IconButton } from '@/components/IconButton';
import { colors } from '@/theme/tokens';
import { goBackSafe } from '@/utils/navigation';

interface Props {
  onPress?: () => void;
  right?: ReactNode;
}

/**
 * Barra superior con botón "volver". Aplica SafeArea top para que el botón
 * no quede debajo de la barra de estado en pantallas que pintan su propio header.
 * Layout: [< ] (espacio) [right]. Por defecto usa goBackSafe (fallback a tab inicial).
 */
export function BackBar({ onPress, right }: Props) {
  const handle = onPress ?? goBackSafe;
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
        {right ?? <View style={{ width: 44 }} />}
      </View>
    </SafeAreaView>
  );
}
