import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii } from '@/theme/tokens';

import { Text } from './Text';

interface Props {
  label: string;
  leftIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'ok' | 'bad' | 'warn';
}

export function Chip({ label, leftIcon, style, tone = 'default' }: Props) {
  const bg =
    tone === 'ok'
      ? colors.okSubtle
      : tone === 'bad'
      ? colors.badSubtle
      : tone === 'warn'
      ? colors.warnSubtle
      : colors.raised;
  const fg =
    tone === 'ok'
      ? colors.ok
      : tone === 'bad'
      ? colors.bad
      : tone === 'warn'
      ? colors.warn
      : colors.textSec;
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
