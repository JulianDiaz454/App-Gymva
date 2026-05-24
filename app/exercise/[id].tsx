import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronIcon, TrendIcon } from '@/components/AppIcons';
import { BackBar } from '@/components/BackBar';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { LineChart } from '@/components/LineChart';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { getExercise } from '@/db/queries/exercises';
import { getExerciseHistory, type ExerciseSessionPoint } from '@/db/queries/progress';
import type { Exercise } from '@/db/schema';
import { colors, radii, space } from '@/theme/tokens';
import { formatLongDate, formatShortDate } from '@/utils/date';
import { formatNumber } from '@/utils/format';

type Metric = 'top' | 'volume';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exId = Number(id);

  const [ex, setEx] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<ExerciseSessionPoint[]>([]);
  const [metric, setMetric] = useState<Metric>('top');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());

  const toggleExpanded = (sessionId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    if (!Number.isFinite(exId)) return;
    let cancelled = false;
    setLoadError(null);
    (async () => {
      try {
        const [e, h] = await Promise.all([getExercise(exId), getExerciseHistory(exId)]);
        if (cancelled) return;
        setEx(e);
        setHistory(h);
        setHoverIdx(h.length - 1);
      } catch (err) {
        if (cancelled) return;
        console.warn('exercise/[id] load:', err);
        setLoadError('No se pudo cargar el ejercicio.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [exId]);

  const values = useMemo(
    () => history.map((h) => (metric === 'top' ? h.topWeight : h.volume)),
    [history, metric],
  );

  // Stats derivadas memoizadas: recalculan solo cuando cambian las values, no
  // en cada hover. Para Math.max evitamos el spread (rompe con miles de items).
  const stats = useMemo(() => {
    if (values.length === 0) return { last: 0, first: 0, max: 0, change: 0 };
    const last = values[values.length - 1]!;
    const first = values[0]!;
    let max = -Infinity;
    for (const v of values) if (v > max) max = v;
    const change = first > 0 ? ((last - first) / first) * 100 : 0;
    return { last, first, max, change };
  }, [values]);
  const { last, first, max, change } = stats;

  // history.reverse() crea un array nuevo en cada render — memoizamos.
  const historyReversed = useMemo(() => history.slice().reverse(), [history]);

  if (loadError) {
    return (
      <Screen withTabBar={false}>
        <BackBar />
        <EmptyState emoji="⚠️" title={loadError} message="Vuelve atrás y reintenta." />
      </Screen>
    );
  }

  if (!ex) {
    return (
      <Screen withTabBar={false}>
        <EmptyState emoji="❓" title="Ejercicio no encontrado" />
      </Screen>
    );
  }

  if (history.length === 0) {
    return (
      <Screen withTabBar={false}>
        <BackBar />
        <View style={styles.hero}>
          <ExerciseIcon icon={ex.icon} color={ex.color} size="lg" />
          <View style={{ flex: 1 }}>
            <Text variant="title">{ex.name}</Text>
            <Text variant="caption" tone="secondary">{ex.muscleGroup ?? '—'}</Text>
          </View>
        </View>
        <EmptyState
          emoji="📈"
          title="Sin historial"
          message="Las gráficas aparecerán cuando registres tu primera serie de este ejercicio."
        />
      </Screen>
    );
  }

  const currentPoint = hoverIdx != null ? history[hoverIdx] : history[history.length - 1];
  const currentValue =
    hoverIdx != null ? values[hoverIdx] ?? last : last;

  const unit = metric === 'top' ? 'kg' : 'kg';

  return (
    <Screen withTabBar={false}>
      <BackBar
        right={
          <Text variant="caption" style={{ fontWeight: '600', minWidth: 100, textAlign: 'right' }}>
            Levantamiento
          </Text>
        }
      />

      {/* Hero */}
      <View style={styles.hero}>
        <ExerciseIcon icon={ex.icon} color={ex.color} size="lg" />
        <View style={{ flex: 1 }}>
          <Text variant="title">{ex.name}</Text>
          <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
            {ex.muscleGroup ?? '—'} · {history.length} sesiones
          </Text>
        </View>
      </View>

      {/* Metric toggle */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: space.xl, paddingTop: space.xl }}>
        <MetricPill label="Peso máx" active={metric === 'top'} onPress={() => setMetric('top')} />
        <MetricPill label="Volumen" active={metric === 'volume'} onPress={() => setMetric('volume')} />
      </View>

      {/* Big number */}
      <View style={{ paddingHorizontal: space.xl, paddingTop: 16 }}>
        <Text variant="eyebrow" tone="muted" style={{ marginBottom: 6 }}>
          {metric === 'top' ? 'Peso máximo por sesión' : 'Volumen total por sesión'}
        </Text>
        <Text tabular style={styles.bigNum}>
          {formatNumber(currentValue)}
          <Text style={styles.unitSuffix}>  {unit}</Text>
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <View
            style={[
              styles.changePill,
              {
                backgroundColor: change >= 0 ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
              },
            ]}
          >
            <TrendIcon size={12} color={change >= 0 ? colors.ok : colors.bad} dir={change >= 0 ? 'up' : 'down'} />
            <Text
              tabular
              style={{
                color: change >= 0 ? colors.ok : colors.bad,
                fontWeight: '600',
                fontSize: 12,
              }}
            >
              {change >= 0 ? '+' : ''}
              {formatNumber(last - first, { decimals: 1 })} {unit}
            </Text>
          </View>
          <Text variant="micro" tone="muted">
            {currentPoint ? formatShortDate(currentPoint.date) : ''}
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View style={{ paddingHorizontal: 8, paddingTop: 12 }}>
        <LineChart
          values={values}
          dates={history.map((h) => h.date)}
          color={ex.color}
          hoverIdx={hoverIdx}
          onHover={setHoverIdx}
        />
      </View>

      {/* Stats */}
      <View style={{ paddingHorizontal: space.xl, paddingTop: 16, flexDirection: 'row', gap: 10 }}>
        <Stat label="Máximo" value={formatNumber(max)} unit={unit} />
        <Stat label="Última" value={formatNumber(last)} unit={unit} />
        <Stat
          label="Sesiones"
          value={formatNumber(history.length)}
          unit=""
        />
      </View>

      {/* Per-session details */}
      <View style={{ paddingHorizontal: space.xl, paddingTop: 28 }}>
        <Text variant="section" tone="muted" style={{ marginBottom: 10 }}>
          Historial por sesión
        </Text>
        <Text variant="micro" tone="muted" style={{ marginBottom: 10 }}>
          Toca una sesión para ver el detalle de cada serie
        </Text>
        <View style={{ gap: 8 }}>
          {historyReversed.map((h) => {
            const isOpen = expanded.has(h.sessionId);
            return (
              <Card key={h.sessionId} padding={0}>
                <Pressable
                  onPress={() => toggleExpanded(h.sessionId)}
                  style={({ pressed }) => [
                    { padding: 14 },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <Text variant="bodyStrong" style={{ fontSize: 14, textTransform: 'capitalize' }}>
                          {formatLongDate(h.date)}
                        </Text>
                        <Text tabular variant="caption" tone="secondary">
                          pico {formatNumber(h.topWeight)} kg
                        </Text>
                      </View>
                      <Text tabular variant="micro" tone="muted">
                        {formatNumber(h.setCount)} series · {formatNumber(h.totalReps)} reps · vol {formatNumber(h.volume)} kg
                      </Text>
                    </View>
                    <ChevronIcon size={14} color={colors.textMut} dir={isOpen ? 'up' : 'down'} />
                  </View>
                </Pressable>
                {isOpen ? (
                  <View style={styles.setsList}>
                    {h.sets.map((s) => (
                      <View key={s.setNumber} style={styles.setRow}>
                        <Text variant="micro" tone="muted" style={{ width: 64, letterSpacing: 0.6, fontWeight: '700' }}>
                          SERIE {formatNumber(s.setNumber)}
                        </Text>
                        <Text tabular style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.text }}>
                          {formatNumber(s.weight)}
                          <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textMut }}> kg</Text>
                        </Text>
                        <Text tabular style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                          ×{' '}
                          <Text tabular style={{ fontSize: 14, fontWeight: '700' }}>
                            {formatNumber(s.reps)}
                          </Text>
                          <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textMut }}> reps</Text>
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

function MetricPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.metricPill,
        { backgroundColor: active ? colors.text : colors.surface },
      ]}
    >
      <Text
        variant="caption"
        style={{ color: active ? colors.bg : colors.textSec, fontWeight: '600' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="eyebrow" tone="muted" style={{ marginBottom: 6 }}>
        {label}
      </Text>
      <Text tabular style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
        {value}
        {unit ? <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textMut }}>{` ${unit}`}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: space.xl,
    paddingTop: 18,
  },
  bigNum: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1.5,
    lineHeight: 50,
  },
  unitSuffix: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSec,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  metricPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderRadius: radii.md,
    padding: 12,
  },
  setsList: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 2,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
});
