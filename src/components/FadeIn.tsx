import { type ReactNode } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { ViewStyle, StyleProp } from 'react-native';

interface Props {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export function FadeInView({ children, delay = 0, style }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(220).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}
