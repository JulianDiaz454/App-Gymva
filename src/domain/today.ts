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
