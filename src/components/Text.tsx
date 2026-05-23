import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { colors, typography } from '@/theme/tokens';

type Variant = keyof typeof typography;

type Tone = 'primary' | 'secondary' | 'muted' | 'inverse' | 'ok' | 'bad' | 'warn';

const TONES: Record<Tone, string> = {
  primary: colors.text,
  secondary: colors.textSec,
  muted: colors.textMut,
  inverse: colors.bg,
  ok: colors.ok,
  bad: colors.bad,
  warn: colors.warn,
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  /** Tipografía tabular para números (alinea pesos/reps). */
  tabular?: boolean;
}

export function Text({ variant = 'body', tone = 'primary', tabular, style, ...rest }: TextProps) {
  const variantStyle = typography[variant] as TextStyle;
  const tabularStyle: TextStyle | null = tabular
    ? { fontVariant: ['tabular-nums'], fontFamily: 'monospace' }
    : null;
  return (
    <RNText
      {...rest}
      style={[variantStyle, { color: TONES[tone] }, tabularStyle, style]}
    />
  );
}
