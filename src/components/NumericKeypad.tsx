import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { BackspaceIcon, CheckIcon } from '@/components/AppIcons';
import { Text } from '@/components/Text';
import { colors, radii } from '@/theme/tokens';

export type KeyValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'back';

const KEYS: KeyValue[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];

interface Props {
  onKey: (k: KeyValue) => void;
  onSave: () => void;
  saveLabel?: string;
}

export function NumericKeypad({ onKey, onSave, saveLabel = 'Guardar serie' }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleSave = () => {
    scale.value = withSequence(
      withSpring(0.96, { damping: 18, stiffness: 380 }),
      withSpring(1, { damping: 14, stiffness: 220 }),
    );
    onSave();
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {KEYS.map((k) => (
          <Pressable
            key={k}
            onPress={() => onKey(k)}
            style={({ pressed }) => [
              styles.key,
              pressed && { backgroundColor: colors.elevated, transform: [{ scale: 0.96 }] },
            ]}
          >
            {k === 'back' ? (
              <BackspaceIcon size={22} color={colors.textSec} />
            ) : (
              <Text style={styles.keyText}>{k === '.' ? ',' : k}</Text>
            )}
          </Pressable>
        ))}
      </View>
      <Animated.View style={animatedStyle}>
        <Pressable onPress={handleSave} style={styles.save}>
          <CheckIcon size={18} color={colors.bg} />
          <Text variant="bodyStrong" style={styles.saveText}>{saveLabel}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 4,
    gap: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  key: {
    width: '24%',
    height: 54,
    backgroundColor: colors.surface,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    color: colors.text,
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  save: {
    height: 60,
    backgroundColor: colors.text,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  saveText: {
    color: colors.bg,
    fontSize: 17,
    fontWeight: '700',
  },
});
