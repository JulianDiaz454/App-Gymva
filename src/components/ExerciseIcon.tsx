import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from './Text';

type Size = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<Size, { box: number; radius: number; emoji: number }> = {
  xs: { box: 32, radius: 10, emoji: 16 },
  sm: { box: 40, radius: 12, emoji: 20 },
  md: { box: 52, radius: 16, emoji: 26 },
  lg: { box: 64, radius: 20, emoji: 32 },
};

interface Props {
  icon: string;
  color: string;
  size?: Size;
  dim?: boolean;
}

export function ExerciseIcon({ icon, color, size = 'md', dim }: Props) {
  const { box, radius, emoji } = SIZE_MAP[size];
  return (
    <View
      style={[
        styles.container,
        {
          width: box,
          height: box,
          borderRadius: radius,
          backgroundColor: color,
          opacity: dim ? 0.6 : 1,
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={{ fontSize: emoji, lineHeight: emoji + 2 }}>{icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
});
