import { type ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors, radii } from '@/theme/tokens';

export interface IconButtonProps {
  onPress?: () => void;
  children: ReactNode;
  size?: number;
  variant?: 'raised' | 'primary' | 'transparent';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function IconButton({
  onPress,
  children,
  size = 44,
  variant = 'raised',
  style,
  disabled,
  accessibilityLabel,
}: IconButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg =
    variant === 'primary'
      ? colors.text
      : variant === 'transparent'
      ? 'transparent'
      : colors.raised;

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => {
          scale.value = withSpring(0.93, { damping: 20, stiffness: 360 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 20, stiffness: 360 });
        }}
        style={[
          styles.base,
          {
            width: size,
            height: size,
            backgroundColor: bg,
            borderRadius: radii.pill,
          },
          disabled && { opacity: 0.4 },
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
