import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconKind = 'flame' | 'chart' | 'cal' | 'routines' | 'more';

interface Props {
  kind: IconKind;
  color: string;
  active?: boolean;
  size?: number;
}

export function TabIcon({ kind, color, active, size = 22 }: Props) {
  const strokeWidth = active ? 2.2 : 1.6;
  const fill = active ? color : 'none';
  const fillOpacity = active ? 0.15 : 0;

  switch (kind) {
    case 'flame':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3c.6 3.5 3 4.8 3 7.5a3 3 0 11-6 0c0-1 .3-1.6.5-2-2 1.3-3.5 3.4-3.5 6A6 6 0 0018 15c0-5-3.5-7-6-12z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            fill={fill}
            fillOpacity={fillOpacity}
          />
        </Svg>
      );
    case 'chart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 19V5M4 19h16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path
            d="M7 15l3.5-4 3 2.5L18 7"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'cal':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3.5"
            y="5"
            width="17"
            height="15.5"
            rx="3"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={fill}
            fillOpacity={fillOpacity}
          />
          <Path
            d="M8 3.5v3M16 3.5v3M3.5 10h17"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'routines':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3.5"
            y="4"
            width="17"
            height="16"
            rx="2.5"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={fill}
            fillOpacity={fillOpacity}
          />
          <Path
            d="M8 9h8M8 12.5h8M8 16h5"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'more':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="6" cy="12" r="1.8" fill={color} />
          <Circle cx="12" cy="12" r="1.8" fill={color} />
          <Circle cx="18" cy="12" r="1.8" fill={color} />
        </Svg>
      );
  }
}
