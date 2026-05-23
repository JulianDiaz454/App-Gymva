import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { ChevronIcon, ClockIcon, CheckIcon } from '@/components/AppIcons';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { FadeInView } from '@/components/FadeIn';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { StaggerItem } from '@/components/StaggerItem';
import { Text } from '@/components/Text';
import { createSession } from '@/db/queries/sessions';
import { getTodayState, type TodayState, type TodayPlanBlock } from '@/domain/today';
import { colors, radii, space } from '@/theme/tokens';
import { formatLongDate } from '@/utils/date';
import { formatNumber } from '@/utils/format';

export default function TodayScreen() {
  const [state, setState] = useState<TodayState | null>(null);

  const load = useCallback(async () => {
    const s = await getTodayState();
    setState(s);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const blocks = useMemo<TodayPlanBlock[]>(() => state?.planned ?? [], [state]);
  const sessionBlocks = state?.session?.blocks ?? [];

  // Mapeo planeado -> sets registrados por exerciseId
  const completedByExercise = useMemo(() => {
    const m = new Map<number, { setsCount: number; topWeight: number }>();
    for (const b of sessionBlocks) {
      if (b.skipped) continue;
      if (b.sets.length === 0) continue;
      const top = Math.max(...b.sets.map((s) => s.weight));
      m.set(b.exerciseId, { setsCount: b.sets.length, topWeight: top });
    }
    return m;
  }, [sessionBlocks]);

  const skippedByExercise = useMemo(() => {
    const m = new Set<number>();
    for (const b of sessionBlocks) {
      if (b.skipped) m.add(b.exerciseId);
    }
    return m;
  }, [sessionBlocks]);

  const done = blocks.filter((b) => completedByExercise.has(b.exerciseId)).length;
  const total = blocks.length;
  const allDone = total > 0 && done === total;

  if (!state) return null;

  const startSession = async (blockIdx = 0) => {
    let sessionId = state.session?.id;
    if (!sessionId) {
      const r = await createSession({ date: state.date, routineDayId: state.routineDayId });
      if (!r.ok) return;
      sessionId = r.session.id;
    }
    router.push({
      pathname: '/session',
      params: { sessionId: String(sessionId), startIdx: String(blockIdx) },
    });
  };

  if (blocks.length === 0) {
    return (
      <Screen>
        <EmptyState
          emoji="🧘"
          title="Día libre"
          message={
            state.routine
              ? 'Hoy no hay rutina planeada. Aprovecha para recuperar o entrena algo libre.'
              : 'Aún no tienes rutina asignada. Crea una desde Ejercicios > Rutinas y asígnala a la semana actual.'
          }
          action={
            <Button label="Entrenar libre" variant="ghost" onPress={() => startSession(0)} />
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FadeInView>
      <Header
        eyebrow={formatLongDate(state.date)}
        title={state.routineDayLabel ?? state.routine?.name ?? 'Entrenamiento'}
      />

      {/* Subtitle row */}
      <View style={{ paddingHorizontal: space.xl, marginTop: -8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {state.routine ? <Chip label={state.routine.name} /> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <ClockIcon size={13} color={colors.textMut} />
            <Text variant="caption" tone="secondary">~{Math.max(20, blocks.length * 10)} min</Text>
          </View>
          <Text tone="muted">·</Text>
          <Text variant="caption" tone="secondary">{total} ejercicios</Text>
        </View>
      </View>

      {/* Progress strip */}
      <View style={{ paddingHorizontal: space.xl, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text variant="caption" tone="secondary">Progreso de hoy</Text>
          <Text variant="caption" tone="secondary" tabular>{done}/{total}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressBar, { width: `${total > 0 ? (done / total) * 100 : 0}%` }]}
          />
        </View>
      </View>

      {/* CTA */}
      <View style={{ padding: space.xl }}>
        <Button
          label={allDone ? 'Ver resumen' : done > 0 ? 'Continuar entrenamiento' : 'Iniciar entrenamiento'}
          fullWidth
          onPress={() => {
            const idx = blocks.findIndex((b) => !completedByExercise.has(b.exerciseId));
            startSession(idx === -1 ? 0 : idx);
          }}
          rightIcon={<ChevronIcon size={14} color={colors.bg} dir="right" />}
        />
      </View>

      {/* Exercise list */}
      <View style={{ paddingHorizontal: space.xl, gap: 10 }}>
        <Text variant="section" tone="muted" style={{ marginBottom: 4 }}>Ejercicios</Text>
        {blocks.map((b, idx) => {
          const completed = completedByExercise.get(b.exerciseId);
          const isSkipped = skippedByExercise.has(b.exerciseId);
          const detail = completed
            ? `${formatNumber(completed.setsCount)} series · ${formatNumber(completed.topWeight)} kg`
            : `${formatNumber(b.targetSets)} × ${formatNumber(b.targetReps)}${
                b.targetWeight ? ` · ${formatNumber(b.targetWeight)} kg` : ''
              }`;
          return (
            <StaggerItem key={b.routineExerciseId} index={idx}>
            <Pressable
              onPress={() => startSession(idx)}
              style={[
                styles.exerciseRow,
                { opacity: isSkipped ? 0.5 : 1 },
              ]}
            >
              <ExerciseIcon icon={b.icon} color={b.color} size="md" dim={!!completed} />
              <View style={{ flex: 1 }}>
                <Text
                  variant="bodyStrong"
                  style={{
                    fontSize: 16,
                    textDecorationLine: isSkipped ? 'line-through' : 'none',
                    marginBottom: 3,
                  }}
                >
                  {b.name}
                </Text>
                <Text
                  variant="caption"
                  tone={completed ? 'muted' : 'secondary'}
                  tabular
                >
                  {detail}
                </Text>
              </View>
              {completed ? (
                <View style={styles.doneBadge}>
                  <CheckIcon size={15} color={colors.ok} />
                </View>
              ) : isSkipped ? (
                <Chip label="Saltado" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text variant="micro" tone="muted" style={{ fontWeight: '500' }}>
                    #{idx + 1}
                  </Text>
                  <ChevronIcon size={12} color={colors.textMut} dir="right" />
                </View>
              )}
            </Pressable>
            </StaggerItem>
          );
        })}
      </View>

      <View style={{ paddingTop: 20, paddingHorizontal: space.xl }}>
        <Text variant="micro" tone="muted" style={{ textAlign: 'center' }}>
          Toca un ejercicio para empezar por él
        </Text>
      </View>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressTrack: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.raised,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.text,
    borderRadius: radii.pill,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  doneBadge: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(74,222,128,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
