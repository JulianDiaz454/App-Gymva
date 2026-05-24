import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Si true, el ScrollView no se renderiza en SafeArea (para layouts con header propio). */
  noPadding?: boolean;
  /**
   * Indica si la pantalla vive dentro de las tabs. Cuando true, agrega
   * paddingBottom suficiente para que el contenido scrolleable no quede
   * tapado por la tab bar absolute.
   * Por defecto true porque las pantallas que NO viven en tabs (modales,
   * stack secundarias) suelen pasar scroll={false} o gestionar su propio padding.
   */
  withTabBar?: boolean;
}

// Altura aproximada de la tab bar custom (`app/(tabs)/_layout.tsx`):
//   wrapper.paddingTop 8 + bar (item.minHeight 58 + padding 6*2) + safe-area-extra
const TAB_BAR_HEIGHT = 78;

export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
  edges,
  noPadding,
  withTabBar = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const padBottom = withTabBar
    ? TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16
    : 24;

  if (!scroll) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={edges ?? (noPadding ? [] : ['top'])}
      >
        {children}
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container} edges={edges ?? []}>
      <ScrollView
        contentContainerStyle={[{ paddingBottom: padBottom }, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function ScreenView({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
