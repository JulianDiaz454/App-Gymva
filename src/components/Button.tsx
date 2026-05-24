import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors, radii } from '@/theme/tokens';

import { Text } from './Text';

type Variant = 'primary' | 'ghost' | 'soft';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: Variant;
  /**
   * Tamaño explícito que ignora el alto por defecto de la variante.
   * Útil para igualar alturas cuando hay dos Buttons (p.ej. primary + ghost) en una row.
   */
  size?: Size;
  /** Ocupa todo el ancho disponible del padre. */
  fullWidth?: boolean;
  /**
   * Comparte espacio con otros hermanos flex (flex: 1). Úsalo para Buttons
   * lado a lado dentro de una row, en lugar de fullWidth (que rompe el row).
   */
  flexed?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Estilo extra para el contenedor exterior animado. */
  style?: StyleProp<ViewStyle>;
}

const SIZE_HEIGHT: Record<Size, number> = { sm: 36, md: 44, lg: 56 };

export function Button({
  label,
  variant = 'primary',
  size,
  fullWidth,
  flexed,
  leftIcon,
  rightIcon,
  disabled,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: ButtonProps) {
  const heightOverride = size ? { height: SIZE_HEIGHT[size] } : null;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const variantStyles = STYLES[variant];

  return (
    <Animated.View
      style={[
        fullWidth && { width: '100%' },
        flexed && { flex: 1 },
        animatedStyle,
        style,
      ]}
    >
      <Pressable
        {...rest}
        disabled={disabled}
        onPressIn={(e) => {
          scale.value = withSpring(0.97, { damping: 20, stiffness: 320 });
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withSpring(1, { damping: 20, stiffness: 320 });
          onPressOut?.(e);
        }}
        style={[
          styles.base,
          variantStyles.container,
          (fullWidth || flexed) && { width: '100%' },
          heightOverride,
          disabled && { opacity: 0.45 },
        ]}
      >
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <Text
          variant={variant === 'soft' ? 'caption' : 'bodyStrong'}
          style={[{ color: variantStyles.text }, variantStyles.textStyle]}
        >
          {label}
        </Text>
        {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const STYLES: Record<Variant, { container: object; text: string; textStyle?: object }> = {
  primary: {
    container: {
      height: 56,
      backgroundColor: colors.text,
      borderRadius: radii.md,
      paddingHorizontal: 20,
    },
    text: colors.bg,
    textStyle: { fontSize: 17, fontWeight: '700' },
  },
  ghost: {
    container: {
      height: 44,
      backgroundColor: colors.raised,
      borderRadius: radii.sm,
      paddingHorizontal: 16,
    },
    text: colors.text,
  },
  soft: {
    container: {
      height: 36,
      backgroundColor: colors.accentSubtle,
      borderRadius: radii.pill,
      paddingHorizontal: 14,
    },
    text: colors.textSec,
  },
};
