/**
 * Pantalla Sesión — el corazón de la app.
 * Registro en vivo: teclado calculator-style, persistencia en SQLite por serie,
 * separación estricta planeado vs realizado, soporte para saltar/sustituir/añadir.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CloseIcon,
  PlusIcon,
  SearchIcon,
  SkipIcon,
  SwapIcon,
} from '@/components/AppIcons';
import { BottomSheet } from '@/components/BottomSheet';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { IconButton } from '@/components/IconButton';
import { NumericKeypad, type KeyValue } from '@/components/NumericKeypad';
import { Text } from '@/components/Text';
import { listExercises } from '@/db/queries/exercises';
import {
  deleteSet,
  ensureSessionBlock,
  getSession,
  logSet,
  replaceSessionExercise,
  setSkipped,
  type SessionFull,
} from '@/db/queries/sessions';
import type { Exercise, SetRow } from '@/db/schema';
import { getTodayState, type TodayPlanBlock } from '@/domain/today';
import { colors, radii, space } from '@/theme/tokens';
import { displayInputBuffer, formatNumber, parseDecimalInput } from '@/utils/format';

type Field = 'weight' | 'reps';

interface UIBlock {
  // origen
  exerciseId: number;
  routineExerciseId: number | null;
  // del catálogo
  name: string;
  icon: string;
  color: string;
  muscleGroup: string | null;
  // plan
  targetSets: number;
  targetReps: number;
  targetWeight: number | null;
  // session block (si existe)
  sessionExerciseId: number | null;
  skipped: boolean;
  sets: SetRow[];
}

export default function SessionScreen() {
  const params = useLocalSearchParams<{ sessionId?: string; startIdx?: string }>();
  const sessionId = Number(params.sessionId);
  const initialIdx = Number(params.startIdx ?? '0');

  const [session, setSession] = useState<SessionFull | null>(null);
  const [plan, setPlan] = useState<TodayPlanBlock[]>([]);
  const [activeIdx, setActiveIdx] = useState(initialIdx);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Input state
  const [field, setField] = useState<Field>('weight');
  const [activeSet, setActiveSet] = useState(0);
  const [buffer, setBuffer] = useState<string | null>(null);
  const [weights, setWeights] = useState<number[]>([]);
  const [reps, setReps] = useState<number[]>([]);
  const [setIds, setSetIds] = useState<Array<number | null>>([]);
  const [error, setError] = useState<string | null>(null);

  // Sheets
  const [sheet, setSheet] = useState<null | 'replace' | 'add'>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(sessionId)) return;
    const s = await getSession(sessionId);
    setSession(s);
    const today = await getTodayState();
    setPlan(today.planned);
    setExercises(await listExercises());
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  // Construye bloques UI fusionando plan + sesión
  const blocks = useMemo<UIBlock[]>(() => {
    if (!session) return [];
    const planByEx = new Map(plan.map((p) => [p.exerciseId, p]));
    const sessionByEx = new Map(session.blocks.map((b) => [b.exerciseId, b]));

    const all: UIBlock[] = [];
    // Plan items
    for (const p of plan) {
      const sb = sessionByEx.get(p.exerciseId);
      all.push({
        exerciseId: p.exerciseId,
        routineExerciseId: p.routineExerciseId,
        name: p.name,
        icon: p.icon,
        color: p.color,
        muscleGroup: p.muscleGroup,
        targetSets: p.targetSets,
        targetReps: p.targetReps,
        targetWeight: p.targetWeight,
        sessionExerciseId: sb?.id ?? null,
        skipped: sb?.skipped ?? false,
        sets: sb?.sets ?? [],
      });
    }
    // Improvisados (en sesión pero no en plan)
    for (const sb of session.blocks) {
      if (planByEx.has(sb.exerciseId)) continue;
      const ex = exercises.find((e) => e.id === sb.exerciseId);
      if (!ex) continue;
      all.push({
        exerciseId: sb.exerciseId,
        routineExerciseId: null,
        name: ex.name,
        icon: ex.icon,
        color: ex.color,
        muscleGroup: ex.muscleGroup,
        targetSets: Math.max(3, sb.sets.length || 3),
        targetReps: 10,
        targetWeight: null,
        sessionExerciseId: sb.id,
        skipped: sb.skipped,
        sets: sb.sets,
      });
    }
    return all;
  }, [session, plan, exercises]);

  const current = blocks[activeIdx];

  // Cierra la sesión de forma segura: si el navigator no puede ir atrás
  // (caso raro al haber sido remplazado), enviamos al tab inicial.
  const goBackSafe = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // Handlers de los bottom sheets (declarados arriba para usarse también en
  // el early-return del estado "sesión libre sin bloques").
  const ensureBlock = async (): Promise<number | null> => {
    if (!current) return null;
    if (current.sessionExerciseId != null) return current.sessionExerciseId;
    const sb = await ensureSessionBlock({
      sessionId,
      exerciseId: current.exerciseId,
      wasPlanned: current.routineExerciseId != null,
      order: activeIdx,
    });
    await load();
    return sb.id;
  };

  const onPickReplace = async (exId: number) => {
    setSheet(null);
    const blockId = await ensureBlock();
    if (blockId != null) {
      await replaceSessionExercise(blockId, exId);
      await load();
    }
  };

  const onPickAdd = async (exId: number) => {
    setSheet(null);
    await ensureSessionBlock({
      sessionId,
      exerciseId: exId,
      wasPlanned: false,
      order: blocks.length,
    });
    await load();
    setActiveIdx(blocks.length);
  };

  // Inicializa buffers cuando cambia el bloque activo
  useEffect(() => {
    if (!current) return;
    const existingSets = current.sets;
    const targetSetsCount = Math.max(current.targetSets, existingSets.length);
    const wArr: number[] = [];
    const rArr: number[] = [];
    const idArr: Array<number | null> = [];
    for (let i = 0; i < targetSetsCount; i++) {
      const ex = existingSets[i];
      wArr.push(ex?.weight ?? current.targetWeight ?? 0);
      rArr.push(ex?.reps ?? current.targetReps);
      idArr.push(ex?.id ?? null);
    }
    setWeights(wArr);
    setReps(rArr);
    setSetIds(idArr);
    const nextIdx = idArr.findIndex((id) => id == null);
    setActiveSet(nextIdx === -1 ? Math.max(0, idArr.length - 1) : nextIdx);
    setField('weight');
    setBuffer(null);
    setError(null);
  }, [activeIdx, current]);

  if (!Number.isFinite(sessionId) || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text tone="secondary">Cargando…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Sesión libre sin plan ni bloques aún: CTA para añadir el primer ejercicio.
  if (!current) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <IconButton onPress={goBackSafe}>
            <CloseIcon size={18} color={colors.text} />
          </IconButton>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="eyebrow" tone="muted">Sesión libre</Text>
            <Text variant="caption" style={{ fontWeight: '600' }}>Sin plan</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32 }}>
          <Text style={{ fontSize: 56 }}>💪</Text>
          <Text variant="title" style={{ textAlign: 'center' }}>Empieza añadiendo un ejercicio</Text>
          <Text variant="caption" tone="secondary" style={{ textAlign: 'center', maxWidth: 280 }}>
            No hay nada planeado para hoy. Elige el primer ejercicio de tu catálogo y construye la sesión sobre la marcha.
          </Text>
          <Pressable
            onPress={() => setSheet('add')}
            style={({ pressed }) => [
              { backgroundColor: colors.text, paddingHorizontal: 24, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <PlusIcon size={18} color={colors.bg} />
            <Text variant="bodyStrong" style={{ color: colors.bg, fontWeight: '700' }}>Añadir ejercicio</Text>
          </Pressable>
        </View>
        <BottomSheet
          visible={sheet === 'add'}
          onClose={() => setSheet(null)}
          title="Añadir ejercicio"
          tall
        >
          <ExerciseList exercises={exercises} onPick={onPickAdd} />
        </BottomSheet>
      </SafeAreaView>
    );
  }

  const total = blocks.length;
  const displayedValue =
    buffer != null
      ? displayInputBuffer(buffer)
      : formatNumber(field === 'weight' ? weights[activeSet] ?? 0 : reps[activeSet] ?? 0);

  const onKey = (k: KeyValue) => {
    let buf = buffer ?? '';
    if (k === 'back') {
      buf = buf.length > 0 ? buf.slice(0, -1) : '';
      setBuffer(buf);
      return;
    }
    if (k === '.') {
      if (field === 'reps') return; // reps son enteros
      if (!buf.includes('.')) buf = (buf || '0') + '.';
      setBuffer(buf);
      return;
    }
    if (buf === '' || buf === '0') buf = k;
    else buf = (buf + k).slice(0, 6);
    setBuffer(buf);
  };

  const commitField = (next: Field) => {
    if (buffer != null) {
      const parsed = parseDecimalInput(buffer);
      if (parsed != null) {
        if (field === 'weight') {
          setWeights((prev) => prev.map((v, i) => (i === activeSet ? parsed : v)));
        } else {
          setReps((prev) => prev.map((v, i) => (i === activeSet ? Math.round(parsed) : v)));
        }
      }
    }
    setField(next);
    setBuffer(null);
    setError(null);
  };

  const saveSet = async () => {
    // Commit el buffer al estado primero
    let weight = weights[activeSet] ?? 0;
    let r = reps[activeSet] ?? 0;
    if (buffer != null) {
      const parsed = parseDecimalInput(buffer);
      if (parsed != null) {
        if (field === 'weight') weight = parsed;
        else r = Math.round(parsed);
      }
    }

    const blockId = await ensureBlock();
    if (blockId == null) {
      setError('No se pudo crear el bloque');
      return;
    }

    const existingId = setIds[activeSet];
    let result;
    if (existingId != null) {
      const { updateSet } = await import('@/db/queries/sessions');
      result = await updateSet(existingId, { weight, reps: r });
    } else {
      result = await logSet({
        sessionExerciseId: blockId,
        setNumber: activeSet + 1,
        weight,
        reps: r,
      });
    }

    if (!result.ok) {
      const firstKey = Object.keys(result.errors)[0];
      setError((firstKey && result.errors[firstKey]) ?? 'Error al guardar');
      return;
    }
    setError(null);
    setBuffer(null);

    // Refresca y avanza
    await load();
    const nextSetIdx = activeSet + 1;
    if (nextSetIdx < weights.length) {
      setActiveSet(nextSetIdx);
      setField('weight');
    } else {
      // Bloque completo; pasa al siguiente bloque no completado
      const nextBlock = blocks.findIndex(
        (b, i) => i > activeIdx && !b.skipped && b.sets.length < b.targetSets,
      );
      if (nextBlock >= 0) {
        setActiveIdx(nextBlock);
      } else {
        goBackSafe();
      }
    }
  };

  const addSet = () => {
    setWeights((prev) => [...prev, prev[prev.length - 1] ?? current.targetWeight ?? 0]);
    setReps((prev) => [...prev, prev[prev.length - 1] ?? current.targetReps]);
    setSetIds((prev) => [...prev, null]);
    setActiveSet(weights.length);
    setField('weight');
    setBuffer(null);
  };

  const removeSet = async (idx: number) => {
    const id = setIds[idx];
    if (id != null) await deleteSet(id);
    setWeights((prev) => prev.filter((_, i) => i !== idx));
    setReps((prev) => prev.filter((_, i) => i !== idx));
    setSetIds((prev) => prev.filter((_, i) => i !== idx));
    if (activeSet >= idx && activeSet > 0) setActiveSet(activeSet - 1);
    if (id != null) await load();
  };

  const onSkip = async () => {
    const blockId = await ensureBlock();
    if (blockId != null) {
      await setSkipped(blockId, true);
      await load();
    }
    const nextBlock = blocks.findIndex((b, i) => i > activeIdx && !b.skipped && b.sets.length === 0);
    if (nextBlock >= 0) setActiveIdx(nextBlock);
    else goBackSafe();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <IconButton onPress={goBackSafe}>
          <CloseIcon size={18} color={colors.text} />
        </IconButton>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text variant="eyebrow" tone="muted" style={{ marginBottom: 2 }}>
            Ejercicio {activeIdx + 1} de {total}
          </Text>
          <Text variant="caption" style={{ fontWeight: '600' }}>
            Sesión
          </Text>
        </View>
        {/* Espacio reservado para mantener el título centrado sin botón derecho */}
        <View style={{ width: 44 }} />
      </View>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {blocks.map((b, i) => {
          const completed = !b.skipped && b.sets.length >= b.targetSets;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === activeIdx ? colors.text : completed ? 'rgba(250,250,250,0.45)' : colors.raised,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <ExerciseIcon icon={current.icon} color={current.color} size="lg" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="title" style={{ lineHeight: 26 }}>{current.name}</Text>
          <Text variant="caption" tone="secondary" style={{ marginTop: 4 }} tabular>
            Objetivo: {formatNumber(current.targetSets)} × {formatNumber(current.targetReps)}
            {current.targetWeight ? ` · ${formatNumber(current.targetWeight)} kg` : ''}
          </Text>
        </View>
      </View>

      {/* Set chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.setsRow}>
        {weights.map((w, i) => {
          const isLogged = setIds[i] != null;
          const isActive = i === activeSet;
          return (
            <Pressable
              key={i}
              onPress={() => {
                setActiveSet(i);
                setField('weight');
                setBuffer(null);
              }}
              onLongPress={() => removeSet(i)}
              style={[
                styles.setChip,
                {
                  backgroundColor: isActive
                    ? colors.text
                    : isLogged
                    ? colors.elevated
                    : colors.surface,
                },
              ]}
            >
              <Text
                variant="micro"
                style={{
                  fontWeight: '700',
                  color: isActive ? colors.textMut : colors.textMut,
                  letterSpacing: 0.6,
                }}
              >
                SERIE {i + 1}
              </Text>
              <View>
                <Text
                  tabular
                  style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: isActive ? colors.bg : isLogged ? colors.text : colors.textSec,
                  }}
                >
                  {w ? formatNumber(w) : '—'}
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '500',
                      color: isActive ? colors.bg : colors.textMut,
                    }}
                  >
                    {' '}kg
                  </Text>
                </Text>
                <Text
                  tabular
                  style={{
                    fontSize: 12,
                    marginTop: 4,
                    color: isActive ? colors.textMut : colors.textMut,
                  }}
                >
                  × {reps[i] ? formatNumber(reps[i]!) : '—'}
                </Text>
              </View>
            </Pressable>
          );
        })}
        <Pressable onPress={addSet} style={styles.addSet}>
          <PlusIcon size={16} color={colors.textMut} />
        </Pressable>
      </ScrollView>

      {/* Field selector */}
      <View style={styles.fieldRow}>
        <FieldPill label="Peso" active={field === 'weight'} onPress={() => commitField('weight')} />
        <FieldPill label="Reps" active={field === 'reps'} onPress={() => commitField('reps')} />
      </View>

      {/* Big number */}
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Text
          tabular
          style={{
            fontSize: 80,
            fontWeight: '600',
            color: error ? colors.bad : colors.text,
            letterSpacing: -2.4,
            lineHeight: 84,
          }}
        >
          {displayedValue}
        </Text>
        <Text variant="caption" tone="muted" style={{ marginTop: 4, fontWeight: '500' }}>
          {field === 'weight' ? 'kilogramos' : 'repeticiones'}
        </Text>
        {error ? (
          <View style={{
            marginTop: 10,
            paddingHorizontal: 14,
            paddingVertical: 8,
            backgroundColor: 'rgba(248,113,113,0.12)',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(248,113,113,0.4)',
          }}>
            <Text variant="caption" tone="bad" style={{ fontWeight: '600' }}>
              {error}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Keypad */}
      <NumericKeypad onKey={onKey} onSave={saveSet} />

      {/* Actions */}
      <View style={styles.actions}>
        <ActionBtn icon={<SkipIcon size={15} color={colors.textSec} />} label="Saltar" onPress={onSkip} />
        <ActionBtn
          icon={<SwapIcon size={15} color={colors.textSec} />}
          label="Sustituir"
          onPress={() => setSheet('replace')}
        />
        <ActionBtn
          icon={<PlusIcon size={15} color={colors.textSec} />}
          label="Añadir"
          onPress={() => setSheet('add')}
        />
      </View>

      {/* Bottom sheets */}
      <BottomSheet
        visible={sheet === 'replace'}
        onClose={() => setSheet(null)}
        title="Sustituir ejercicio"
        tall
      >
        <ExerciseList exercises={exercises} onPick={onPickReplace} />
      </BottomSheet>

      <BottomSheet
        visible={sheet === 'add'}
        onClose={() => setSheet(null)}
        title="Añadir ejercicio"
        tall
      >
        <ExerciseList exercises={exercises} onPick={onPickAdd} />
      </BottomSheet>
    </SafeAreaView>
  );
}

function FieldPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.fieldPill,
        { backgroundColor: active ? colors.elevated : 'transparent' },
      ]}
    >
      <Text
        variant="caption"
        style={{ color: active ? colors.text : colors.textMut, fontWeight: '600' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ActionBtn({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        pressed && { backgroundColor: colors.surface },
      ]}
    >
      {icon}
      <Text variant="caption" tone="secondary">{label}</Text>
    </Pressable>
  );
}

function ExerciseList({ exercises, onPick }: { exercises: Exercise[]; onPick: (id: number) => void }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.raised, borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <SearchIcon size={16} color={colors.textMut} />
        <Text variant="caption" tone="muted">Selecciona un ejercicio</Text>
      </View>
      {exercises.map((ex) => (
        <Pressable
          key={ex.id}
          onPress={() => onPick(ex.id)}
          style={({ pressed }) => [
            { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
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
          Aún no tienes ejercicios en tu catálogo.
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: space.xl,
    paddingTop: 14,
  },
  dot: {
    flex: 1,
    height: 3,
    borderRadius: radii.pill,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
  },
  setsRow: {
    paddingHorizontal: space.xl,
    paddingVertical: 16,
    gap: 8,
  },
  setChip: {
    width: 78,
    height: 78,
    padding: 8,
    borderRadius: 16,
    justifyContent: 'space-between',
  },
  addSet: {
    width: 60,
    height: 78,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingTop: 4,
  },
  fieldPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
});
