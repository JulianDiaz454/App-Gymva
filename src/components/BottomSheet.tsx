import { type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
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
}

export function BottomSheet({ visible, onClose, title, eyebrow, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <SafeAreaView edges={['bottom']}>
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
            <View style={{ paddingHorizontal: space.xl, paddingBottom: 28 }}>{children}</View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
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
    maxHeight: '85%',
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
