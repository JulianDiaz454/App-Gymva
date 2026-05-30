/**
 * Resuelve el "estado de hoy" combinando rutina semanal asignada y sesión existente.
 */

import {
  getSessionForDate,
  type SessionFull,
} from '@/db/queries/sessions';
import {
  getRoutineFull,
  getWeekAssignment,
  type RoutineFull,
} from '@/db/queries/routines';
import type { Exercise, SetRow } from '@/db/schema';
import { isoDayOfWeek, todayIso, weekStartIso } from '@/utils/date';

export interface TodayPlanBlock {
  routineExerciseId: number;
  exerciseId: number;
  name: string;
  icon: string;
  color: string;
  muscleGroup: string | null;
  equipment: string | null;
  targetSets: number;
  targetReps: number;
  targetWeight: number | null;
  order: number;
}

export interface TodayState {
  date: string; // ISO YYYY-MM-DD
  routine: RoutineFull | null;
  routineDayId: number | null;
  routineDayLabel: string | null;
  planned: TodayPlanBlock[];
  session: SessionFull | null;
}

export async function getTodayState(): Promise<TodayState> {
  const date = todayIso();
  const ws = weekStartIso(new Date());
  const routineId = await getWeekAssignment(ws);
  const routine = routineId ? await getRoutineFull(routineId) : null;
  const dow = isoDayOfWeek(new Date());
  const day = routine?.days.find((d) => d.dayOfWeek === dow) ?? null;

  const planned: TodayPlanBlock[] =
    day?.exercises.map((re) => ({
      routineExerciseId: re.id,
      exerciseId: re.exerciseId,
      name: re.exercise.name,
      icon: re.exercise.icon,
      color: re.exercise.color,
      muscleGroup: re.exercise.muscleGroup,
      equipment: re.exercise.equipment,
      targetSets: re.targetSets,
      targetReps: re.targetReps,
      targetWeight: re.targetWeight,
      order: re.order,
    })) ?? [];

  const session = await getSessionForDate(date);

  return {
    date,
    routine,
    routineDayId: day?.id ?? null,
    routineDayLabel: day?.label ?? null,
    planned,
    session,
  };
}

// ── Merge plan ↔ sesión (fuente única para Hoy y Sesión) ─────
//
// Un bloque de sesión planeado se vincula a su slot del plan por `order`
// (el índice del plan con el que se creó), NO por `exerciseId`. Esto permite
// que "sustituir" un ejercicio planeado lo reemplace EN SU LUGAR en vez de
// dejar el original visible y añadir el nuevo al final.

export type BlockStatus = 'pending' | 'in_process' | 'completed' | 'skipped';

export interface MergedBlock {
  slot: number;
  exerciseId: number;
  routineExerciseId: number | null;
  name: string;
  icon: string;
  color: string;
  muscleGroup: string | null;
  targetSets: number;
  targetReps: number;
  targetWeight: number | null;
  sessionExerciseId: number | null;
  wasPlanned: boolean;
  skipped: boolean;
  sets: SetRow[];
  status: BlockStatus;
}

function deriveStatus(skipped: boolean, setsDone: number, targetSets: number): BlockStatus {
  if (skipped) return 'skipped';
  if (targetSets > 0 && setsDone >= targetSets) return 'completed';
  if (setsDone > 0) return 'in_process';
  return 'pending';
}

export function mergeSessionBlocks(
  plan: TodayPlanBlock[],
  session: SessionFull | null,
  catalog: Exercise[],
): MergedBlock[] {
  const exById = new Map(catalog.map((e) => [e.id, e]));
  const sessionBlocks = session?.blocks ?? [];

  const plannedByOrder = new Map<number, SessionFull['blocks'][number]>();
  const improvised: SessionFull['blocks'] = [];
  for (const sb of sessionBlocks) {
    if (sb.wasPlanned) plannedByOrder.set(sb.order, sb);
    else improvised.push(sb);
  }

  const out: MergedBlock[] = [];

  for (let i = 0; i < plan.length; i++) {
    const p = plan[i]!;
    const sb = plannedByOrder.get(i);
    const exId = sb ? sb.exerciseId : p.exerciseId;
    const ex = exById.get(exId);
    const sets = sb?.sets ?? [];
    out.push({
      slot: i,
      exerciseId: exId,
      routineExerciseId: p.routineExerciseId,
      // Si el ejercicio fue sustituido, mostramos el del catálogo (el nuevo);
      // si no, el del plan.
      name: ex?.name ?? p.name,
      icon: ex?.icon ?? p.icon,
      color: ex?.color ?? p.color,
      muscleGroup: ex?.muscleGroup ?? p.muscleGroup,
      targetSets: p.targetSets,
      targetReps: p.targetReps,
      targetWeight: p.targetWeight,
      sessionExerciseId: sb?.id ?? null,
      wasPlanned: true,
      skipped: sb?.skipped ?? false,
      sets,
      status: deriveStatus(sb?.skipped ?? false, sets.length, p.targetSets),
    });
  }

  improvised.sort((a, b) => a.order - b.order);
  for (const sb of improvised) {
    const ex = exById.get(sb.exerciseId);
    if (!ex) continue;
    const targetSets = Math.max(3, sb.sets.length || 3);
    out.push({
      slot: out.length,
      exerciseId: sb.exerciseId,
      routineExerciseId: null,
      name: ex.name,
      icon: ex.icon,
      color: ex.color,
      muscleGroup: ex.muscleGroup,
      targetSets,
      targetReps: 10,
      targetWeight: null,
      sessionExerciseId: sb.id,
      wasPlanned: false,
      skipped: sb.skipped,
      sets: sb.sets,
      status: deriveStatus(sb.skipped, sb.sets.length, targetSets),
    });
  }

  return out;
}
