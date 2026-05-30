/**
 * Tokens de diseño centralizados.
 * Copiados literalmente de styles.css del prototipo Gymv y ESPECIFICACION §6.
 * NO usar colores sueltos en componentes — siempre desde aquí.
 */

export const colors = {
  // Superficies
  bg: '#0A0A0B',
  surface: '#141416',
  elevated: '#1C1C20',
  raised: '#232328',
  border: '#26262B',
  borderSoft: 'rgba(255,255,255,0.06)',
  divider: '#1F1F23',

  // Texto
  text: '#FAFAFA',
  textSec: '#A1A1AA',
  textMut: '#52525B',

  // Acento (monocromo — el color vivo entra por los ejercicios)
  accent: '#FFFFFF',
  accentSubtle: 'rgba(255,255,255,0.08)',

  // Estado
  ok: '#4ADE80',
  warn: '#FBBF24',
  bad: '#F87171',

  // Estado — fondos suaves (chips, badges, banners)
  okSubtle: 'rgba(74,222,128,0.16)',
  warnSubtle: 'rgba(251,191,36,0.16)',
  badSubtle: 'rgba(248,113,113,0.16)',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayDeep: 'rgba(0,0,0,0.6)',
} as const;

export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 9999,
} as const;

/** Espaciado en múltiplos de 4 (ESPECIFICACION §6.4). */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  hero: 64,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -0.85, lineHeight: 36 },
  title: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.44 },
  body: { fontSize: 15, fontWeight: '500' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  micro: { fontSize: 12, fontWeight: '500' as const },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.96,
    textTransform: 'uppercase' as const,
  },
  section: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.78,
    textTransform: 'uppercase' as const,
  },
} as const;

/** Curaduría de iconos (emoji) para el selector de ejercicio. */
export const ICON_CHOICES = [
  '🏋️', '💪', '🦵', '🤸', '🦾', '🚣', '🧗', '🪨', '🧠', '💥',
  '⛰️', '🪢', '🔥', '⚡', '🛡️', '🥊', '🎯', '🌀', '🎽', '🏃',
] as const;

/** Paleta vívida pero pensada para fondos oscuros. */
export const COLOR_CHOICES = [
  '#F87171', '#FB923C', '#FBBF24', '#FACC15',
  '#A3E635', '#34D399', '#2DD4BF', '#22D3EE',
  '#60A5FA', '#818CF8', '#A78BFA', '#F472B6',
  '#FB7185', '#94A3B8', '#E879F9', '#10B981',
] as const;

export const MUSCLE_GROUPS = [
  'Pecho', 'Espalda', 'Pierna', 'Hombro', 'Brazo', 'Core', 'Bíceps', 'Tríceps',
] as const;

export const EQUIPMENT = [
  'Mancuernas', 'Barra', 'Polea', 'Peso corporal', 'Máquina', 'Kettlebell', 'Cable',
] as const;

export const ANIM = {
  fast: 120,
  med: 220,
  slow: 320,
  easeOut: [0.2, 0.8, 0.2, 1] as const,
};
