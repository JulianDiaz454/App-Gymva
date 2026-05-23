import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii } from '@/theme/tokens';

import { Text } from './Text';

interface Props {
  label: string;
  leftIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'ok' | 'bad';
}

export function Chip({ label, leftIcon, style, tone = 'default' }: Props) {
  const bg =
    tone === 'ok'
      ? 'rgba(74,222,128,0.16)'
      : tone === 'bad'
      ? 'rgba(248,113,113,0.16)'
      : colors.raised;
  const fg = tone === 'ok' ? colors.ok : tone === 'bad' ? colors.bad : colors.textSec;
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 28,
          paddingHorizontal: 10,
          borderRadius: radii.pill,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      {leftIcon}
      <Text variant="micro" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
}
