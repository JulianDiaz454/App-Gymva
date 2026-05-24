/**
 * Icons monocromáticos reutilizables (rasgo lineal).
 * Replican el set del prototipo (app.jsx I = { ... }).
 */
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

interface BaseProps {
  size?: number;
  color?: string;
}

export function CheckIcon({ size = 16, color = colors.text }: BaseProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.5l4.5 4.5L19 7"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlusIcon({ size = 18, color = colors.text }: BaseProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 18, color = colors.text }: BaseProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronIcon({
  size = 14,
  color = colors.text,
  dir = 'right',
}: BaseProps & { dir?: 'left' | 'right' | 'up' | 'down' }) {
  const d = {
    right: 'M9 6l6 6-6 6',
    left: 'M15 6l-6 6 6 6',
    up: 'M6 15l6-6 6 6',
    down: 'M6 9l6 6 6-6',
  }[dir];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BackIcon({ size = 20, color = colors.text }: BaseProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 6l-6 6 6 6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SwapIcon({ size = 18, color = colors.text }: BaseProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 7h13l-3-3M17 17H4l3 3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SkipIcon({ size = 18, color = colors.text }: BaseProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 5l9 7-9 7V5zM18 5v14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EditIcon({ size = 18, color = colors.text }: BaseProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 4l6 6-10 10H4v-6L14 4z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TrashIcon({ size = 18, color = colors.text }: BaseProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 7h14M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M7 7v12a2 2 0 002 2h6a2 2 0 002-2V7"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TrendIcon({
  size = 14,
  color = colors.text,
  dir = 'up',
}: BaseProps & { dir?: 'up' | 'down' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={dir === 'down' ? { transform: [{ scaleY: -1 }] } : undefined}
    >
      <Path
        d="M4 17l7-7 3 3 6-7M14 6h6v6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ClockIcon({ size = 14, color = colors.text }: BaseProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function SearchIcon({ size = 18, color = colors.text }: BaseProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth={1.8} />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function BackspaceIcon({ size = 22, color = colors.text }: BaseProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5h11a2 2 0 012 2v10a2 2 0 01-2 2H9l-7-7 7-7z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path
        d="M13 9l5 6M18 9l-5 6"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}
