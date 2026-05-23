import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Si true, el ScrollView no se renderiza en SafeArea (para layouts con header propio). */
  noPadding?: boolean;
}

export function Screen({ children, scroll = true, contentContainerStyle, edges, noPadding }: Props) {
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
        contentContainerStyle={[{ paddingBottom: 120 }, contentContainerStyle]}
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
