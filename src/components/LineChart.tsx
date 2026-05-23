import { useMemo } from 'react';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { colors } from '@/theme/tokens';
import { formatShortDate } from '@/utils/date';
import { formatNumber } from '@/utils/format';

interface Props {
  values: number[];
  dates: string[];
  color: string;
  hoverIdx?: number | null;
  onHover?: (idx: number) => void;
  height?: number;
}

const PAD_L = 32;
const PAD_R = 14;
const PAD_T = 18;
const PAD_B = 24;
const W = 360;

export function LineChart({ values, dates, color, hoverIdx, onHover, height = 200 }: Props) {
  const H = height;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const { pts, gridY, labels, area, line } = useMemo(() => {
    if (values.length === 0) {
      return { pts: [] as Array<[number, number]>, gridY: [] as number[], labels: [] as Array<{ x: number; text: string }>, area: '', line: '' };
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const padMin = min - range * 0.15;
    const padMax = max + range * 0.1;
    const padRange = padMax - padMin;

    const pts: Array<[number, number]> = values.map((v, i) => {
      const x = PAD_L + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
      const y = PAD_T + innerH - ((v - padMin) / padRange) * innerH;
      return [x, y];
    });
    const line = 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ');
    const lastPt = pts[pts.length - 1]!;
    const firstPt = pts[0]!;
    const area = line + ` L ${lastPt[0]},${PAD_T + innerH} L ${firstPt[0]},${PAD_T + innerH} Z`;
    const gridY = [0, 0.5, 1].map((t) => PAD_T + innerH * t);
    const labelIdx = values.length === 1
      ? [0]
      : [0, Math.floor((values.length - 1) / 2), values.length - 1].filter((v, i, a) => a.indexOf(v) === i);
    const labels = labelIdx.map((i) => ({
      x: pts[i]![0],
      text: dates[i] ? formatShortDate(dates[i]!) : '',
    }));
    return { pts, gridY, labels, area, line };
  }, [values, dates, innerW, innerH]);

  if (values.length === 0) return null;
  const hover = hoverIdx != null ? pts[hoverIdx] : null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padMin = min - range * 0.15;
  const padMax = max + range * 0.1;

  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      <Defs>
        <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {gridY.map((y, i) => (
        <Line key={i} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke={colors.border} strokeWidth={1} />
      ))}
      {[padMax, (padMax + padMin) / 2, padMin].map((v, i) => (
        <SvgText
          key={i}
          x={PAD_L - 6}
          y={gridY[i]! + 4}
          textAnchor="end"
          fontSize="10"
          fill={colors.textMut}
        >
          {formatNumber(Math.round(v))}
        </SvgText>
      ))}
      {labels.map((l, i) => (
        <SvgText
          key={i}
          x={l.x}
          y={H - 6}
          textAnchor="middle"
          fontSize="10"
          fill={colors.textMut}
        >
          {l.text}
        </SvgText>
      ))}
      <Path d={area} fill="url(#lineGrad)" />
      <Path d={line} stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <Circle
          key={i}
          cx={x}
          cy={y}
          r={i === hoverIdx ? 4.5 : 2.5}
          fill={i === hoverIdx ? color : colors.bg}
          stroke={i === hoverIdx ? colors.bg : color}
          strokeWidth={i === hoverIdx ? 2.5 : 1.5}
          onPress={() => onHover?.(i)}
        />
      ))}
      {hover ? (
        <Line
          x1={hover[0]}
          y1={PAD_T}
          x2={hover[0]}
          y2={PAD_T + innerH}
          stroke={colors.text}
          strokeOpacity={0.25}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      ) : null}
    </Svg>
  );
}
