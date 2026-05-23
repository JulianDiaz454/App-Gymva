import { type ReactNode } from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface Props {
  index?: number;
  children: ReactNode;
  delayStep?: number;
}

/**
 * Item de lista con animación de entrada (fade + traslación hacia arriba).
 * Replica el `.stagger` del prototipo usando reanimated.
 */
export function StaggerItem({ children, index = 0, delayStep = 40 }: Props) {
  return (
    <Animated.View entering={FadeInUp.duration(280).delay(index * delayStep)}>
      {children}
    </Animated.View>
  );
}
