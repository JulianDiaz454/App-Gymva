import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CloseIcon, PlusIcon, TrashIcon } from '@/components/AppIcons';
import { BottomSheet } from '@/components/BottomSheet';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { FieldError } from '@/components/FieldError';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { listExercises } from '@/db/queries/exercises';
import {
  addRoutineExercise,
  clearRoutineDayExercises,
  createRoutine,
  deleteRoutineDay,
  getRoutineFull,
  removeRoutineExercise,
  setRoutineDay,
  updateRoutine,
  updateRoutineExercise,
  type RoutineFull,
} from '@/db/queries/routines';
import type { Exercise } from '@/db/schema';
import { colors, COLOR_CHOICES, radii, space } from '@/theme/tokens';
import { formatNumber } from '@/utils/format';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

interface DayState {
  routineDayId: number | null;
  label: string | null;
  exercises: Array<{
    id: number | null; // routine_exercise id
    exerciseId: number;
    targetSets: number;
    targetReps: number;
    targetWeight: number | null;
    order: number;
  }>;
}

export default function RoutineEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const routineId = id ? Number(id) : null;
  const isNew = routineId == null;

  const [full, setFull] = useState<RoutineFull | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(COLOR_CHOICES[8]!);
  const [colorOpen, setColorOpen] = useState(false);
  const [days, setDays] = useState<DayState[]>(() => Array.from({ length: 7 }, () => ({ routineDayId: null, label: null, exercises: [] })));
  const [activeDay, setActiveDay] = useState(0);
  const [picker, setPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setExercises(await listExercises());
    if (routineId) {
      const f = await getRoutineFull(routineId);
      if (f) {
        setFull(f);
        setName(f.name);
        setColor(f.color);
        const nextDays: DayState[] = Array.from({ length: 7 }, () => ({ routineDayId: null, label: null, exercises: [] }));
        for (const d of f.days) {
          nextDays[d.dayOfWeek] = {
            routineDayId: d.id,
            label: d.label,
            exercises: d.exercises.map((e) => ({
              id: e.id,
              exerciseId: e.exerciseId,
              targetSets: e.targetSets,
              targetReps: e.targetReps,
              targetWeight: e.targetWeight,
              order: e.order,
            })),
          };
        }
        setDays(nextDays);
      }
    }
  }, [routineId]);

  useEffect(() => {
    load();
  }, [load]);

  const canSave = name.trim().length > 0 && days.some((d) => d.label != null);

  const day = days[activeDay]!;

  const toggleDay = () => {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== activeDay) return d;
        if (d.label != null) return { ...d, label: null, exercises: [] };
        return { ...d, label: 'Entrenamiento' };
      }),
    );
  };

  const updateDayLabel = (label: string) => {
    setDays((prev) => prev.map((d, i) => (i === activeDay ? { ...d, label } : d)));
  };

  const addExercise = (exerciseId: number) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === activeDay
          ? {
              ...d,
              label: d.label ?? 'Entrenamiento',
              exercises: [
                ...d.exercises,
                {
                  id: null,
                  exerciseId,
                  targetSets: 4,
                  targetReps: 10,
                  targetWeight: null,
                  order: d.exercises.length,
                },
              ],
            }
          : d,
      ),
    );
    setPicker(false);
  };

  const updateExercise = (idx: number, patch: Partial<DayState['exercises'][number]>) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === activeDay
          ? {
              ...d,
              exercises: d.exercises.map((e, ei) => (ei === idx ? { ...e, ...patch } : e)),
            }
          : d,
      ),
    );
  };

  const removeExercise = (idx: number) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === activeDay ? { ...d, exercises: d.exercises.filter((_, ei) => ei !== idx) } : d,
      ),
    );
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setErrors({});
    try {
      let rid = routineId;
      if (isNew) {
        const r = await createRoutine({ name: name.trim(), color });
        if (!r.ok) {
          setErrors(r.errors);
          setSaving(false);
          return;
        }
        rid = r.routine.id;
      } else {
        const r = await updateRoutine(rid!, { name: name.trim(), color });
        if (!r.ok) {
          setErrors(r.errors);
          setSaving(false);
          return;
        }
      }

      // Sincronizar días
      for (let i = 0; i < 7; i++) {
        const d = days[i]!;
        if (d.label == null) {
          // Día de descanso: borrar si existía
          if (d.routineDayId != null) await deleteRoutineDay(d.routineDayId);
          continue;
        }
        const rd = await setRoutineDay({
          routineId: rid!,
          dayOfWeek: i,
          label: d.label,
        });
        // Borrar ejercicios previos y reinsertar (más simple que diff)
        await clearRoutineDayExercises(rd.id);
        for (let ei = 0; ei < d.exercises.length; ei++) {
          const e = d.exercises[ei]!;
          await addRoutineExercise({
            routineDayId: rd.id,
            exerciseId: e.exerciseId,
            targetSets: e.targetSets,
            targetReps: e.targetReps,
            targetWeight: e.targetWeight,
            order: ei,
          });
        }
      }
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrors({ _form: msg });
    } finally {
      setSaving(false);
    }
  };

  const exerciseById = (id: number) => exercises.find((e) => e.id === id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <IconButton onPress={() => router.back()}>
          <CloseIcon size={18} color={colors.text} />
        </IconButton>
        <Text variant="bodyStrong">{isNew ? 'Nueva rutina' : 'Editar rutina'}</Text>
        <Pressable
          onPress={save}
          disabled={!canSave || saving}
          style={({ pressed }) => [
            styles.saveBtn,
            { opacity: canSave && !saving ? (pressed ? 0.6 : 1) : 0.4 },
          ]}
        >
          <Text variant="bodyStrong" tone={canSave ? 'primary' : 'muted'}>
            Guardar
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Name + color */}
        <View style={styles.nameRow}>
          <Pressable
            onPress={() => setColorOpen((o) => !o)}
            style={[styles.colorPick, { backgroundColor: color, shadowColor: color }]}
          />
          <TextInput
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (errors.name) setErrors((e) => ({ ...e, name: '' }));
            }}
            placeholder="Nombre de la rutina"
            placeholderTextColor={colors.textMut}
            style={styles.nameInput}
            maxLength={60}
          />
        </View>
        <FieldError message={errors.name} />

        {colorOpen ? (
          <View style={{ paddingHorizontal: space.xl, paddingBottom: 16 }}>
            <View style={styles.colorGrid}>
              {COLOR_CHOICES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => {
                    setColor(c);
                    setColorOpen(false);
                  }}
                  style={[
                    styles.colorChoice,
                    { backgroundColor: c, borderColor: c === color ? colors.bg : 'transparent', borderWidth: c === color ? 3 : 0 },
                  ]}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Day selector */}
        <Text variant="section" tone="muted" style={{ paddingHorizontal: space.xl, paddingBottom: 8 }}>
          Días de la semana
        </Text>
        <View style={styles.daySelector}>
          {days.map((d, i) => {
            const isActive = activeDay === i;
            const has = d.label != null;
            return (
              <Pressable
                key={i}
                onPress={() => setActiveDay(i)}
                style={[
                  styles.dayBtn,
                  {
                    backgroundColor: isActive
                      ? colors.text
                      : has
                      ? `${color}40`
                      : colors.surface,
                  },
                ]}
              >
                <Text
                  variant="micro"
                  style={{
                    color: isActive ? colors.bg : has ? colors.text : colors.textMut,
                    fontWeight: '600',
                    letterSpacing: 0.4,
                  }}
                >
                  {DAY_SHORT[i]}
                </Text>
                <Text
                  tabular
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: isActive ? colors.bg : has ? colors.text : colors.textMut,
                  }}
                >
                  {has ? d.exercises.length : '·'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Day editor */}
        <View style={{ paddingHorizontal: space.xl, paddingTop: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text variant="section" tone="muted">
              {DAY_NAMES[activeDay]}
            </Text>
            <Pressable onPress={toggleDay}>
              <Text variant="caption" tone="secondary" style={{ fontWeight: '600' }}>
                {day.label != null ? 'Marcar descanso' : 'Activar día'}
              </Text>
            </Pressable>
          </View>

          {day.label == null ? (
            <View style={styles.restCard}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🛌</Text>
              <Text variant="bodyStrong">Día de descanso</Text>
              <Text variant="micro" tone="muted" style={{ marginTop: 4 }}>
                Toca "Activar día" para añadir entrenamiento
              </Text>
            </View>
          ) : (
            <>
              <TextInput
                value={day.label}
                onChangeText={updateDayLabel}
                placeholder="Nombre del día (ej. Pecho y tríceps)"
                placeholderTextColor={colors.textMut}
                style={styles.dayLabelInput}
                maxLength={60}
              />
              <View style={{ gap: 8 }}>
                {day.exercises.map((e, ei) => {
                  const ex = exerciseById(e.exerciseId);
                  return (
                    <View key={ei} style={styles.exerciseCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <ExerciseIcon
                          icon={ex?.icon ?? '•'}
                          color={ex?.color ?? colors.raised}
                          size="sm"
                        />
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.text }}>
                          {ex?.name ?? 'Ejercicio'}
                        </Text>
                        <IconButton size={32} variant="transparent" onPress={() => removeExercise(ei)}>
                          <TrashIcon size={15} color={colors.textMut} />
                        </IconButton>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <NumField
                          label="Series"
                          value={e.targetSets}
                          onChange={(v) => updateExercise(ei, { targetSets: v })}
                          min={1}
                          max={20}
                        />
                        <NumField
                          label="Reps"
                          value={e.targetReps}
                          onChange={(v) => updateExercise(ei, { targetReps: v })}
                          min={1}
                          max={100}
                        />
                        <NumField
                          label="Peso"
                          value={e.targetWeight ?? 0}
                          onChange={(v) => updateExercise(ei, { targetWeight: v > 0 ? v : null })}
                          step={2.5}
                          min={0}
                          max={500}
                          suffix="kg"
                        />
                      </View>
                    </View>
                  );
                })}
                <Pressable onPress={() => setPicker(true)} style={styles.addExBtn}>
                  <PlusIcon size={16} color={colors.textSec} />
                  <Text variant="caption" tone="secondary" style={{ fontWeight: '600' }}>
                    Añadir ejercicio
                  </Text>
                </Pressable>
              </View>
            </>
          )}
          {errors._form ? (
            <Text variant="caption" tone="bad" style={{ marginTop: 16, textAlign: 'center' }}>
              {errors._form}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <BottomSheet visible={picker} onClose={() => setPicker(false)} title="Elegir ejercicio">
        <ScrollView style={{ maxHeight: 480 }}>
          {exercises.map((ex) => (
            <Pressable
              key={ex.id}
              onPress={() => addExercise(ex.id)}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 10,
                  borderBottomColor: colors.borderSoft,
                  borderBottomWidth: 1,
                },
                pressed && { opacity: 0.6 },
              ]}
            >
              <ExerciseIcon icon={ex.icon} color={ex.color} size="sm" />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{ex.name}</Text>
                <Text variant="micro" tone="muted">
                  {ex.muscleGroup ?? '—'} · {ex.equipment ?? '—'}
                </Text>
              </View>
            </Pressable>
          ))}
          {exercises.length === 0 ? (
            <Text tone="muted" variant="caption" style={{ textAlign: 'center', padding: 20 }}>
              Crea ejercicios primero desde la pestaña Ejercicios.
            </Text>
          ) : null}
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

function NumField({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <View style={styles.numField}>
      <Text variant="micro" tone="muted" style={{ fontSize: 10, fontWeight: '600' }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
        <Pressable
          onPress={() => onChange(Math.max(min, Number((value - step).toFixed(2))))}
          style={styles.numStep}
        >
          <Text style={{ color: colors.textSec }}>−</Text>
        </Pressable>
        <Text
          tabular
          style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700', color: colors.text }}
        >
          {formatNumber(value)}
          {suffix ? <Text style={{ fontSize: 10, color: colors.textMut, fontWeight: '500' }}>{` ${suffix}`}</Text> : null}
        </Text>
        <Pressable
          onPress={() => onChange(Math.min(max, Number((value + step).toFixed(2))))}
          style={styles.numStep}
        >
          <Text style={{ color: colors.textSec }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  saveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: space.xl,
    paddingVertical: 16,
  },
  colorPick: {
    width: 48,
    height: 48,
    borderRadius: 14,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  nameInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  colorChoice: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
  },
  daySelector: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 6,
  },
  dayBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  restCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  dayLabelInput: {
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  addExBtn: {
    height: 48,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  numField: {
    flex: 1,
    backgroundColor: colors.raised,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  numStep: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
