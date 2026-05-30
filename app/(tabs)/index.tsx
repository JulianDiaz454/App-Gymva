import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { ChevronIcon, ClockIcon, CheckIcon } from '@/components/AppIcons';
import { BottomSheet } from '@/components/BottomSheet';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { FadeInView } from '@/components/FadeIn';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { StaggerItem } from '@/components/StaggerItem';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { listExercisesIncludingArchived } from '@/db/queries/exercises';
import { clearDayOverride, setDayOverride, type RoutineFull } from '@/db/queries/routines';
import { createSession } from '@/db/queries/sessions';
import type { Exercise } from '@/db/schema';
import { getTodayState, mergeSessionBlocks, type MergedBlock, type TodayState } from '@/domain/today';
import { colors, radii, space } from '@/theme/tokens';
import { formatLongDate } from '@/utils/date';
import { formatNumber } from '@/utils/format';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function TodayScreen() {
  const [state, setState] = useState<TodayState | null>(null);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [startError, setStartError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, ex] = await Promise.all([getTodayState(), listExercisesIncludingArchived()]);
    setState(s);
    setCatalog(ex);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Fuente única de merge plan↔sesión (igual que la pantalla de Sesión): así un
  // ejercicio sustituido se refleja en su lugar y no aparecen ejercicios "extra".
  const blocks = useMemo<MergedBlock[]>(
    () => (state ? mergeSessionBlocks(state.planned, state.session, catalog) : []),
    [state, catalog],
  );

  // Atendido = completado o saltado (decisión explícita de no hacerlo hoy).
  const attended = blocks.filter(
    (b) => b.status === 'completed' || b.status === 'skipped',
  ).length;
  const done = blocks.filter((b) => b.status === 'completed').length;
  const total = blocks.length;
  const allDone = total > 0 && attended === total;

  if (!state) return null;

  const startSession = async (blockIdx = 0) => {
    setStartError(null);
    let sessionId = state.session?.id;
    if (!sessionId) {
      try {
        const r = await createSession({ date: state.date, routineDayId: state.routineDayId });
        if (!r.ok) {
          const firstKey = Object.keys(r.errors)[0];
          setStartError((firstKey && r.errors[firstKey]) ?? 'No se pudo crear la sesión');
          return;
        }
        sessionId = r.session.id;
      } catch (e) {
        setStartError(e instanceof Error ? e.message : 'No se pudo crear la sesión');
        return;
      }
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
            <View style={{ alignItems: 'center', gap: 10 }}>
              <Button label="Entrenar libre" variant="ghost" onPress={() => startSession(0)} />
              {startError ? (
                <Text variant="caption" tone="bad">{startError}</Text>
              ) : null}
            </View>
          }
        />
        {/* Aunque hoy sea descanso, permitir adelantar el día de otro día. */}
        {state.routine ? (
          <DayOverrideControl
            routine={state.routine}
            date={state.date}
            currentDayId={state.routineDayId}
            isOverridden={state.isDayOverridden}
            canChange={!state.session}
            onChanged={load}
          />
        ) : null}
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

      {state.routine ? (
        <DayOverrideControl
          routine={state.routine}
          date={state.date}
          currentDayId={state.routineDayId}
          isOverridden={state.isDayOverridden}
          canChange={!state.session}
          onChanged={load}
        />
      ) : null}

      {/* Progress strip */}
      <View style={{ paddingHorizontal: space.xl, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text variant="caption" tone="secondary">Progreso de hoy</Text>
          <Text variant="caption" tone="secondary" tabular>
            {attended}/{total}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressBar, { width: `${total > 0 ? (attended / total) * 100 : 0}%` }]}
          />
        </View>
      </View>

      {/* CTA */}
      <View style={{ padding: space.xl }}>
        <Button
          label={allDone ? 'Ver resumen' : done > 0 ? 'Continuar entrenamiento' : 'Iniciar entrenamiento'}
          fullWidth
          onPress={() => {
            const idx = blocks.findIndex(
              (b) => b.status !== 'completed' && b.status !== 'skipped',
            );
            startSession(idx === -1 ? 0 : idx);
          }}
          rightIcon={<ChevronIcon size={14} color={colors.bg} dir="right" />}
        />
        {startError ? (
          <Text variant="caption" tone="bad" style={{ textAlign: 'center', marginTop: 10 }}>
            {startError}
          </Text>
        ) : null}
      </View>

      {/* Exercise list */}
      <View style={{ paddingHorizontal: space.xl, gap: 10 }}>
        <Text variant="section" tone="muted" style={{ marginBottom: 4 }}>Ejercicios</Text>
        {blocks.map((b, idx) => {
          const isCompleted = b.status === 'completed';
          const isInProcess = b.status === 'in_process';
          const isSkipped = b.status === 'skipped';
          const topWeight = b.sets.length ? Math.max(...b.sets.map((s) => s.weight)) : 0;
          const detail = isCompleted
            ? `${formatNumber(b.sets.length)} series · ${formatNumber(topWeight)} kg`
            : isInProcess
            ? `${formatNumber(b.sets.length)} de ${formatNumber(b.targetSets)} series`
            : `${formatNumber(b.targetSets)} × ${formatNumber(b.targetReps)}${
                b.targetWeight ? ` · ${formatNumber(b.targetWeight)} kg` : ''
              }`;
          return (
            <StaggerItem key={b.slot} index={idx}>
            <Pressable
              onPress={() => startSession(idx)}
              style={[
                styles.exerciseRow,
                { opacity: isSkipped ? 0.5 : 1 },
              ]}
            >
              <ExerciseIcon icon={b.icon} color={b.color} size="md" dim={isCompleted} />
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
                  tone={isCompleted ? 'muted' : 'secondary'}
                  tabular
                >
                  {detail}
                </Text>
              </View>
              {isCompleted ? (
                <View style={styles.doneBadge}>
                  <CheckIcon size={15} color={colors.ok} />
                </View>
              ) : isInProcess ? (
                <Chip label="En proceso" tone="warn" />
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

/**
 * F2 — control para hacer hoy el día de otro día de la rutina. Solo se permite
 * cambiar mientras no se haya iniciado la sesión de hoy (`canChange`); una vez
 * empezada, se muestra deshabilitado.
 */
function DayOverrideControl({
  routine,
  date,
  currentDayId,
  isOverridden,
  canChange,
  onChanged,
}: {
  routine: RoutineFull;
  date: string;
  currentDayId: number | null;
  isOverridden: boolean;
  canChange: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (routine.days.length === 0) return null;

  const pick = async (routineDayId: number) => {
    setOpen(false);
    const r = await setDayOverride(date, routineDayId);
    if (!r.ok) {
      toast.error(r.errors._form ?? 'No se pudo cambiar el día');
      return;
    }
    toast.success('Día actualizado para hoy');
    onChanged();
  };

  const reset = async () => {
    setOpen(false);
    const r = await clearDayOverride(date);
    if (!r.ok) {
      toast.error(r.errors._form ?? 'No se pudo restablecer');
      return;
    }
    toast.info('Se restableció el día normal');
    onChanged();
  };

  return (
    <View style={{ paddingHorizontal: space.xl, paddingTop: 10 }}>
      <Pressable
        onPress={() => canChange && setOpen(true)}
        style={[styles.changeDay, !canChange && { opacity: 0.45 }]}
      >
        <Text variant="caption" tone="secondary" style={{ fontWeight: '600' }}>
          {canChange ? 'Cambiar día de hoy' : 'Sesión iniciada — no se puede cambiar el día'}
        </Text>
        {canChange ? <ChevronIcon size={12} color={colors.textMut} dir="right" /> : null}
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="¿Qué día harás hoy?" tall>
        <View style={{ gap: 8, paddingBottom: 8 }}>
          {isOverridden ? (
            <Pressable onPress={reset} style={styles.dayPickRow}>
              <Text variant="bodyStrong">Día normal de hoy</Text>
              <Text variant="micro" tone="muted">Quitar el cambio</Text>
            </Pressable>
          ) : null}
          {routine.days.map((d) => (
            <Pressable
              key={d.id}
              onPress={() => pick(d.id)}
              style={[
                styles.dayPickRow,
                d.id === currentDayId && { borderColor: colors.text, borderWidth: 1 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{d.label ?? DAY_NAMES[d.dayOfWeek] ?? 'Día'}</Text>
                <Text variant="micro" tone="muted">
                  {DAY_NAMES[d.dayOfWeek] ?? '—'} · {d.exercises.length} ejercicios
                </Text>
              </View>
              {d.id === currentDayId ? <CheckIcon size={15} color={colors.ok} /> : null}
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </View>
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
  changeDay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  dayPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingHorizontal: 16,
    minHeight: 56,
    paddingVertical: 10,
  },
  doneBadge: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: colors.okSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
