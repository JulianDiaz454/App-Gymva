import { type ReactNode } from 'react';
import { View } from 'react-native';

import { colors, radii, space } from '@/theme/tokens';

import { Text } from './Text';

interface Props {
  emoji: string;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ emoji, title, message, action }: Props) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: space.xxl, paddingVertical: space.hero, gap: space.lg }}>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: radii.xl,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 38 }}>{emoji}</Text>
      </View>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text variant="title">{title}</Text>
        {message ? (
          <Text variant="caption" tone="secondary" style={{ textAlign: 'center', maxWidth: 280 }}>
            {message}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}
