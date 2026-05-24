import { type ReactNode } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/AppIcons';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { colors, radii, space } from '@/theme/tokens';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  /**
   * Si true, la sheet ocupa ~90% del viewport para acoger contenido scrolleable
   * (selectores largos). Si false (default), crece con el contenido y se topa
   * con maxHeight 88%.
   */
  tall?: boolean;
  /** Padding horizontal del contenido. Por defecto se aplica space.xl; pasar 0 para que el children gestione su propio padding (útil con ScrollView interno). */
  contentPadding?: number;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  eyebrow,
  children,
  tall = false,
  contentPadding,
}: Props) {
  const screenH = Dimensions.get('window').height;
  const sheetStyle = tall
    ? { height: screenH * 0.9 }
    : { maxHeight: screenH * 0.88 };

  // Layout clave para que el scroll interior funcione al primer toque:
  // - El scrim es un Pressable detrás (StyleSheet.absoluteFill) que cierra al
  //   tocar fuera.
  // - El sheet es un View plano por encima (no Pressable), así no compite con
  //   los gestos de su ScrollView hijo.
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, sheetStyle]}>
          <SafeAreaView edges={['bottom']} style={tall ? { flex: 1 } : undefined}>
            <View style={styles.handle} />
            {(title || eyebrow) && (
              <View style={styles.header}>
                <View>
                  {eyebrow ? (
                    <Text variant="eyebrow" tone="muted">
                      {eyebrow}
                    </Text>
                  ) : null}
                  {title ? <Text variant="title">{title}</Text> : null}
                </View>
                <IconButton size={34} onPress={onClose}>
                  <CloseIcon size={16} color={colors.textSec} />
                </IconButton>
              </View>
            )}
            <View
              style={[
                tall && { flex: 1 },
                {
                  paddingHorizontal: contentPadding ?? space.xl,
                  paddingBottom: contentPadding === 0 ? 0 : 12,
                },
              ]}
            >
              {children}
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingBottom: 12,
  },
});
