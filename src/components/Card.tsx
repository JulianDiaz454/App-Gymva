import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii } from '@/theme/tokens';

interface Props {
  children: ReactNode;
  elevated?: boolean;
  raised?: boolean;
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, elevated, raised, padding = 16, style }: Props) {
  const bg = raised ? colors.raised : elevated ? colors.elevated : colors.surface;
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radii.lg,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
