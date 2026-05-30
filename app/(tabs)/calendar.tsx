import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CheckIcon, ChevronIcon, ClockIcon } from '@/components/AppIcons';
import { BottomSheet } from '@/components/BottomSheet';
import { Card } from '@/components/Card';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { listSessionsInMonth, type SessionSummary } from '@/db/queries/calendar';
import {
  getRoutineFull,
  listRoutines,
  listWeekAssignments,
  setWeekAssignment,
  type RoutineFull,
} from '@/db/queries/routines';
import type { Routine , Exercise } from '@/db/schema';
import { getSessionForDate, type SessionFull } from '@/db/queries/sessions';
import { listExercisesIncludingArchived } from '@/db/queries/exercises';
import { colors, radii, space } from '@/theme/tokens';
import { DOW_LONG_ES, isoDayOfWeek, MONTHS_FULL_ES, toIsoDate, weekStartIso } from '@/utils/date';
import { formatNumber } from '@/utils/format';

const DOW_HEADER = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function CalendarTab() {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineDays, setRoutineDays] = useState<Map<number, RoutineFull['days']>>(new Map());
  const [weekMap, setWeekMap] = useState<Map<string, number>>(new Map());
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const [assignSheet, setAssignSheet] = useState<string | null>(null); // weekStart ISO
  const [sessionDetail, setSessionDetail] = useState<SessionFull | null>(null);

  const load = useCallback(async () => {
    const [rs, was, ses, exs] = await Promise.all([
      listRoutines(),
      listWeekAssignments(),
      listSessionsInMonth(year, month),
      // Incluye archivados: el calendario muestra sesiones históricas que pueden
      // referenciar ejercicios ya archivados; sin esto su nombre/icono se rompe.
      listExercisesIncludingArchived(),
    ]);
    setRoutines(rs);
    setSessions(ses);
    setExercises(exs);
    setWeekMap(new Map(was.map((w) => [w.weekStart, w.routineId])));
    const fulls = await Promise.all(rs.map((r) => getRoutineFull(r.id)));
    const m = new Map<number, RoutineFull['days']>();
    for (let i = 0; i < rs.length; i++) {
      const f = fulls[i];
      if (f) m.set(rs[i]!.id, f.days);
    }
    setRoutineDays(m);
  }, [year, month]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Build month grid
  const { weeks } = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay();
    const isoFirst = (firstDow + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks: (number | null)[][] = [];
    let cur: (number | null)[] = [];
    for (let i = 0; i < isoFirst; i++) cur.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cur.push(d);
      if (cur.length === 7) {
        weeks.push(cur);
        cur = [];
      }
    }
    if (cur.length > 0) {
      while (cur.length < 7) cur.push(null);
      weeks.push(cur);
    }
    return { weeks };
  }, [year, month]);

  const sessionsByDay = useMemo(() => {
    const m = new Map<number, SessionSummary>();
    for (const s of sessions) {
      const d = Number(s.date.slice(-2));
      m.set(d, s);
    }
    return m;
  }, [sessions]);

  const weekRoutineFor = (week: (number | null)[]) => {
    const firstDay = week.find((d) => d !== null) ?? week[0];
    if (firstDay == null) return { weekStart: '', routine: null };
    const ws = weekStartIso(new Date(year, month, firstDay));
    const rid = weekMap.get(ws);
    const r = rid ? routines.find((x) => x.id === rid) : null;
    return { weekStart: ws, routine: r ?? null };
  };

  const plannedNameForDay = (d: number) => {
    const ws = weekStartIso(new Date(year, month, d));
    const rid = weekMap.get(ws);
    if (!rid) return null;
    const days = routineDays.get(rid);
    if (!days) return null;
    const dow = isoDayOfWeek(new Date(year, month, d));
    const day = days.find((x) => x.dayOfWeek === dow);
    return day?.label ?? null;
  };

  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const sessionStats = useMemo(() => {
    const done = sessions.length;
    const planned = weeks.reduce((sum, w) => {
      return (
        sum +
        w.filter((d) => d != null && !sessionsByDay.has(d) && plannedNameForDay(d)).length
      );
    }, 0);
    return { done, planned };
  }, [sessions, sessionsByDay, weeks, weekMap, routineDays]);

  const onSelectDay = useCallback(
    async (d: number) => {
      setSelectedDay(d);
      const date = toIsoDate(new Date(year, month, d));
      const s = await getSessionForDate(date);
      setSessionDetail(s);
    },
    [year, month],
  );

  // Refresca el detalle del día seleccionado cuando cambia el mes o llegan
  // sesiones nuevas. Deps explícitas: incluyen onSelectDay (memoizado por
  // mes/año) y selectedDay, así no hay stale closure si cambia el día
  // seleccionado sin que cambie el mes.
  useEffect(() => {
    onSelectDay(selectedDay);
  }, [onSelectDay, selectedDay, sessions.length]);

  const monthName = MONTHS_FULL_ES[((month % 12) + 12) % 12];

  const monthChange = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const [assignError, setAssignError] = useState<string | null>(null);

  const assignRoutineToWeek = async (rid: number | null) => {
    if (!assignSheet) return;
    try {
      await setWeekAssignment(assignSheet, rid);
      setAssignError(null);
      setAssignSheet(null);
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setAssignError(`No se pudo asignar la rutina: ${msg}`);
    }
  };

  return (
    <Screen>
      {/* Header */}
      <View style={{ paddingHorizontal: space.xl, paddingTop: space.hero, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          <Text variant="eyebrow" tone="muted">{year}</Text>
          <Text variant="display" style={{ textTransform: 'capitalize' }}>{monthName}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <IconButton size={38} onPress={() => monthChange(-1)}>
            <ChevronIcon size={14} color={colors.text} dir="left" />
          </IconButton>
          <IconButton size={38} onPress={() => monthChange(1)}>
            <ChevronIcon size={14} color={colors.text} dir="right" />
          </IconButton>
        </View>
      </View>

      {/* Stats */}
      <View style={{ paddingHorizontal: space.xl, paddingBottom: 12, flexDirection: 'row', gap: 8 }}>
        <MiniStat label="Hechos" value={formatNumber(sessionStats.done)} />
        <MiniStat label="Planeados" value={formatNumber(sessionStats.planned)} />
      </View>

      {/* DOW header */}
      <View style={[styles.gridRow, { paddingHorizontal: space.xl, paddingTop: 10, paddingBottom: 6 }]}>
        <View style={{ width: 52 }} />
        {DOW_HEADER.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="micro" tone="muted" style={{ letterSpacing: 0.6 }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Weeks */}
      <View style={{ paddingHorizontal: 16 }}>
        {weeks.map((week, wi) => {
          const { weekStart, routine } = weekRoutineFor(week);
          return (
            <View key={wi} style={[styles.gridRow, { marginBottom: 4, alignItems: 'stretch' }]}>
              <Pressable
                onPress={() => weekStart && setAssignSheet(weekStart)}
                style={[
                  styles.weekCell,
                  {
                    backgroundColor: routine ? colors.surface : 'transparent',
                    borderStyle: routine ? 'solid' : 'dashed',
                    borderColor: routine ? 'transparent' : colors.border,
                    overflow: 'hidden',
                  },
                ]}
              >
                {routine ? (
                  <>
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        backgroundColor: routine.color,
                      }}
                    />
                    <Text
                      variant="micro"
                      tone="muted"
                      style={{ fontSize: 9, fontWeight: '600', marginBottom: 2 }}
                    >
                      SEM
                    </Text>
                    <Text variant="micro" tone="secondary" style={{ fontSize: 9, fontWeight: '600' }} numberOfLines={1}>
                      {routine.name.split(' ')[0]}
                    </Text>
                  </>
                ) : (
                  <Text style={{ fontSize: 14, color: colors.textMut }}>+</Text>
                )}
              </Pressable>
              {week.map((d, di) => (
                <DayCell
                  key={di}
                  day={d}
                  isToday={d != null && isToday(d)}
                  isSelected={d === selectedDay}
                  done={d != null && sessionsByDay.has(d)}
                  hasPlan={d != null && !sessionsByDay.has(d) && !!plannedNameForDay(d)}
                  routineColor={routine?.color}
                  onPress={() => d && onSelectDay(d)}
                />
              ))}
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendDot type="done" label="Hecho" />
        <LegendDot type="planned" label="Planeado" />
        <LegendDot type="today" label="Hoy" />
      </View>

      {/* Day detail */}
      {(() => {
        const selectedRoutine = weekRoutineFor([selectedDay]).routine;
        return (
          <View style={{ paddingHorizontal: space.xl, paddingTop: 14 }}>
            <DayDetail
              year={year}
              month={month}
              day={selectedDay}
              session={sessionDetail}
              plannedName={plannedNameForDay(selectedDay)}
              routine={selectedRoutine}
              routineDays={
                selectedRoutine ? routineDays.get(selectedRoutine.id) ?? [] : []
              }
              exercises={exercises}
            />
          </View>
        );
      })()}

      {/* Assign-week sheet */}
      <BottomSheet
        visible={assignSheet != null}
        onClose={() => setAssignSheet(null)}
        eyebrow="Asignar rutina"
        title="Semana"
        contentPadding={0}
      >
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: 28, gap: 8 }}>
          {assignSheet && weekMap.has(assignSheet) ? (
            <Pressable onPress={() => assignRoutineToWeek(null)} style={styles.removeBtn}>
              <Text variant="caption" tone="secondary" style={{ fontWeight: '600' }}>
                Quitar rutina de esta semana
              </Text>
            </Pressable>
          ) : null}
          {routines.map((r) => {
            const isCurrent = assignSheet ? weekMap.get(assignSheet) === r.id : false;
            const days = routineDays.get(r.id) ?? [];
            const trainingDays = days.filter((d) => d.label).length;
            return (
              <Pressable
                key={r.id}
                onPress={() => assignRoutineToWeek(r.id)}
                style={[styles.routineBtn, isCurrent && { borderColor: r.color, borderWidth: 2 }]}
              >
                <View style={[styles.routineColorTile, { backgroundColor: r.color }]}>
                  <Text tabular style={{ fontSize: 16, fontWeight: '700', color: colors.bg }}>
                    {trainingDays}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{r.name}</Text>
                  <Text variant="micro" tone="muted">
                    {formatNumber(trainingDays)} días entrenando
                  </Text>
                </View>
                {isCurrent ? <CheckIcon size={16} color={r.color} /> : null}
              </Pressable>
            );
          })}
          {routines.length === 0 ? (
            <Text tone="muted" variant="caption" style={{ textAlign: 'center', padding: 20 }}>
              Aún no tienes rutinas. Créalas desde Ejercicios &gt; Rutinas.
            </Text>
          ) : null}
          {assignError ? (
            <Text tone="bad" variant="caption" style={{ textAlign: 'center', paddingTop: 8 }}>
              {assignError}
            </Text>
          ) : null}
        </ScrollView>
      </BottomSheet>
    </Screen>
  );
}

function DayCell({
  day,
  isToday,
  isSelected,
  done,
  hasPlan,
  routineColor,
  onPress,
}: {
  day: number | null;
  isToday: boolean;
  isSelected: boolean;
  done: boolean;
  hasPlan: boolean;
  routineColor?: string;
  onPress: () => void;
}) {
  if (day == null) return <View style={{ flex: 1, height: 48 }} />;

  let bg: string = 'transparent';
  let fg: string = colors.textSec;
  let borderColor: string = 'transparent';
  let borderStyle: 'solid' | 'dashed' = 'solid';
  if (done) {
    bg = colors.surface;
    fg = colors.text;
  }
  if (hasPlan) {
    bg = 'transparent';
    borderColor = colors.border;
    borderStyle = 'dashed';
  }
  if (isToday) {
    bg = colors.text;
    fg = colors.bg;
    borderColor = colors.text;
    borderStyle = 'solid';
  }

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          flex: 1,
          height: 48,
          borderRadius: 10,
          padding: 4,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
          borderWidth: borderColor === 'transparent' ? 0 : 1,
          borderColor,
          borderStyle,
        },
        isSelected && {
          borderWidth: 1.5,
          borderColor: colors.text,
          borderStyle: 'solid' as const,
        },
      ]}
    >
      <Text
        tabular
        style={{ fontSize: 13, fontWeight: isToday ? '700' : '500', color: fg }}
      >
        {day}
      </Text>
      {(done || hasPlan) && !isToday ? (
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 999,
            backgroundColor: done ? routineColor ?? colors.text : 'transparent',
            borderWidth: hasPlan && !done ? 1 : 0,
            borderColor: colors.textSec,
            marginTop: 3,
          }}
        />
      ) : null}
    </Pressable>
  );
}

function LegendDot({ type, label }: { type: 'done' | 'planned' | 'today'; label: string }) {
  let dot: React.ReactNode = null;
  if (type === 'done')
    dot = <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: colors.text }} />;
  if (type === 'planned')
    dot = <View style={{ width: 8, height: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.textSec }} />;
  if (type === 'today')
    dot = <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: colors.text, borderWidth: 2, borderColor: colors.bg, shadowColor: colors.text, shadowOpacity: 1, shadowRadius: 1 }} />;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {dot}
      <Text variant="micro" tone="muted">{label}</Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card padding={14} style={{ flex: 1 }}>
      <Text variant="micro" tone="muted" style={{ fontWeight: '600', letterSpacing: 0.6, marginBottom: 4 }}>
        {label.toUpperCase()}
      </Text>
      <Text tabular style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
        {value}
      </Text>
    </Card>
  );
}

function DayDetail({
  year,
  month,
  day,
  session,
  plannedName,
  routine,
  routineDays,
  exercises,
}: {
  year: number;
  month: number;
  day: number;
  session: SessionFull | null;
  plannedName: string | null;
  routine: Routine | null;
  routineDays: RoutineFull['days'];
  exercises: Exercise[];
}) {
  const date = new Date(year, month, day);
  const dow = DOW_LONG_ES[date.getDay()] ?? '';

  const isDone = !!session;
  const hasPlan = plannedName != null;

  if (!isDone && !hasPlan) {
    return (
      <Card padding={20} style={{ alignItems: 'center' }}>
        <View style={styles.restIcon}>
          <Text style={{ fontSize: 22 }}>🛌</Text>
        </View>
        <Text variant="bodyStrong" style={{ marginTop: 10, textTransform: 'capitalize' }}>
          {dow} {day}
        </Text>
        <Text variant="caption" tone="secondary">Día libre</Text>
      </Card>
    );
  }

  const name = session?.id ? plannedName ?? 'Entrenamiento' : plannedName ?? 'Entrenamiento';

  // Resolve exercises shown (real session blocks o ejercicios planeados)
  const exById = (id: number) => exercises.find((e) => e.id === id);
  const plannedList = routineDays.find((d) => d.dayOfWeek === isoDayOfWeek(date))?.exercises ?? [];
  const showList: Exercise[] = session
    ? (session.blocks.map((b) => exById(b.exerciseId)).filter((x): x is Exercise => !!x))
    : plannedList.map((p) => p.exercise);

  // Volumen total (si done)
  const volume = session
    ? session.blocks.reduce(
        (sum, b) => sum + b.sets.reduce((s, x) => s + x.weight * x.reps, 0),
        0,
      )
    : 0;
  const setCount = session ? session.blocks.reduce((s, b) => s + b.sets.length, 0) : 0;

  return (
    <Card padding={16}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text variant="eyebrow" tone="muted" style={{ marginBottom: 4, textTransform: 'capitalize' }}>
            {dow} {day}
          </Text>
          <Text variant="bodyStrong" style={{ fontSize: 17, fontWeight: '700' }}>
            {name}
          </Text>
          {routine ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: routine.color }} />
              <Text variant="micro" tone="muted">{routine.name}</Text>
            </View>
          ) : null}
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: isDone ? 'rgba(74,222,128,0.12)' : colors.raised,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: radii.pill,
          }}
        >
          {isDone ? (
            <CheckIcon size={11} color={colors.ok} />
          ) : (
            <ClockIcon size={11} color={colors.textSec} />
          )}
          <Text
            variant="micro"
            style={{
              color: isDone ? colors.ok : colors.textSec,
              fontWeight: '600',
            }}
          >
            {isDone ? 'Completado' : 'Planeado'}
          </Text>
        </View>
      </View>

      {isDone ? (
        <View style={styles.metricsRow}>
          <Metric label="Volumen" value={`${formatNumber(volume)} kg`} />
          <Metric label="Series" value={formatNumber(setCount)} />
          <Metric label="Ejercicios" value={formatNumber(session.blocks.length)} />
        </View>
      ) : null}

      {showList.length > 0 ? (
        <View style={styles.exList}>
          {showList.slice(0, 8).map((ex, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
              <ExerciseIcon icon={ex.icon} color={ex.color} size="xs" />
              <Text variant="caption" tone="secondary" style={{ flex: 1 }}>{ex.name}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text variant="micro" tone="muted">{label}</Text>
      <Text variant="bodyStrong" style={{ fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gridRow: {
    flexDirection: 'row',
    gap: 4,
  },
  weekCell: {
    width: 52,
    minHeight: 48,
    borderRadius: 10,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: space.xl,
    paddingTop: 14,
  },
  restIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
    paddingTop: 14,
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
  },
  exList: {
    marginTop: 14,
    paddingTop: 14,
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
  },
  removeBtn: {
    padding: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 14,
    alignItems: 'center',
  },
  routineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.elevated,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  routineColorTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
