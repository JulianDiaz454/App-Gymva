import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { space } from '@/theme/tokens';

import { Text } from './Text';

interface Props {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Header({ eyebrow, title, right, style }: Props) {
  return (
    <View
      style={[
        {
          paddingTop: space.hero,
          paddingHorizontal: space.xl,
          paddingBottom: space.md,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        },
        style,
      ]}
    >
      <View style={{ flex: 1 }}>
        {eyebrow ? (
          <Text variant="eyebrow" tone="muted" style={{ marginBottom: 6 }}>
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="display">{title}</Text>
      </View>
      {right}
    </View>
  );
}
