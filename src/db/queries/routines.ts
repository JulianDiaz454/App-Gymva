/**
 * Queries de rutinas (lo PLANEADO).
 * Mantiene separación con sesiones (lo realizado).
 */

import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  routineDays,
  routineExercises,
  routines,
  weekAssignments,
  type Exercise,
  type Routine,
  type RoutineDay,
  type RoutineExercise,
} from '@/db/schema';
import { exercises } from '@/db/schema';
import {
  formatZodErrors,
  routineInputSchema,
  type RoutineInput,
} from '@/validation/schemas';

export type RoutineFull = Routine & {
  days: Array<
    RoutineDay & {
      exercises: Array<RoutineExercise & { exercise: Exercise }>;
    }
  >;
};

export async function listRoutines(): Promise<Routine[]> {
  return db.select().from(routines).orderBy(asc(routines.name));
}

export async function getRoutineFull(routineId: number): Promise<RoutineFull | null> {
  const routine = await db.select().from(routines).where(eq(routines.id, routineId)).limit(1);
  const r = routine[0];
  if (!r) return null;

  const days = await db
    .select()
    .from(routineDays)
    .where(eq(routineDays.routineId, routineId))
    .orderBy(asc(routineDays.dayOfWeek));

  const dayIds = days.map((d) => d.id);
  const exs = dayIds.length
    ? await db
        .select({
          re: routineExercises,
          ex: exercises,
        })
        .from(routineExercises)
        .innerJoin(exercises, eq(exercises.id, routineExercises.exerciseId))
        .where(
          // workaround: in() — usamos OR-chain via sql when array is small
          // pero como puede haber hasta 7 días, hacemos un select por día.
          eq(routineExercises.routineDayId, dayIds[0]!),
        )
    : [];

  // Como necesitamos por todos los días, hacemos consultas por cada día.
  const byDay = new Map<number, Array<RoutineExercise & { exercise: Exercise }>>();
  for (const day of days) {
    const rows = await db
      .select({ re: routineExercises, ex: exercises })
      .from(routineExercises)
      .innerJoin(exercises, eq(exercises.id, routineExercises.exerciseId))
      .where(eq(routineExercises.routineDayId, day.id))
      .orderBy(asc(routineExercises.order));
    byDay.set(
      day.id,
      rows.map((r) => ({ ...r.re, exercise: r.ex })),
    );
  }
  void exs; // primer query dummy ignorado

  return {
    ...r,
    days: days.map((d) => ({ ...d, exercises: byDay.get(d.id) ?? [] })),
  };
}

export async function createRoutine(input: RoutineInput): Promise<
  { ok: true; routine: Routine } | { ok: false; errors: Record<string, string> }
> {
  const parsed = routineInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: formatZodErrors(parsed) };
  const [row] = await db.insert(routines).values(parsed.data).returning();
  if (!row) return { ok: false, errors: { _form: 'No se pudo crear la rutina' } };
  return { ok: true, routine: row };
}

export async function updateRoutine(
  id: number,
  input: RoutineInput,
): Promise<{ ok: true; routine: Routine } | { ok: false; errors: Record<string, string> }> {
  const parsed = routineInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: formatZodErrors(parsed) };
  const [row] = await db
    .update(routines)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(routines.id, id))
    .returning();
  if (!row) return { ok: false, errors: { _form: 'Rutina no encontrada' } };
  return { ok: true, routine: row };
}

export async function deleteRoutine(id: number): Promise<void> {
  await db.delete(routines).where(eq(routines.id, id));
}

export async function setRoutineDay(opts: {
  routineId: number;
  dayOfWeek: number;
  label: string | null;
}): Promise<RoutineDay> {
  // Upsert manual: ya existe -> update label; si no -> insert.
  const existing = await db
    .select()
    .from(routineDays)
    .where(and(eq(routineDays.routineId, opts.routineId), eq(routineDays.dayOfWeek, opts.dayOfWeek)))
    .limit(1);
  if (existing[0]) {
    const [row] = await db
      .update(routineDays)
      .set({ label: opts.label })
      .where(eq(routineDays.id, existing[0].id))
      .returning();
    return row ?? existing[0];
  }
  const [row] = await db
    .insert(routineDays)
    .values({ routineId: opts.routineId, dayOfWeek: opts.dayOfWeek, label: opts.label })
    .returning();
  if (!row) throw new Error('No se pudo crear el día de rutina');
  return row;
}

export async function clearRoutineDayExercises(routineDayId: number): Promise<void> {
  await db.delete(routineExercises).where(eq(routineExercises.routineDayId, routineDayId));
}

export async function deleteRoutineDay(routineDayId: number): Promise<void> {
  await db.delete(routineDays).where(eq(routineDays.id, routineDayId));
}

export async function addRoutineExercise(opts: {
  routineDayId: number;
  exerciseId: number;
  targetSets: number;
  targetReps: number;
  targetWeight?: number | null;
  order: number;
}): Promise<RoutineExercise> {
  const [row] = await db
    .insert(routineExercises)
    .values({
      routineDayId: opts.routineDayId,
      exerciseId: opts.exerciseId,
      targetSets: opts.targetSets,
      targetReps: opts.targetReps,
      targetWeight: opts.targetWeight ?? null,
      order: opts.order,
    })
    .returning();
  if (!row) throw new Error('No se pudo añadir el ejercicio');
  return row;
}

export async function updateRoutineExercise(
  id: number,
  patch: Partial<{
    targetSets: number;
    targetReps: number;
    targetWeight: number | null;
    order: number;
  }>,
): Promise<void> {
  await db.update(routineExercises).set(patch).where(eq(routineExercises.id, id));
}

export async function removeRoutineExercise(id: number): Promise<void> {
  await db.delete(routineExercises).where(eq(routineExercises.id, id));
}

// ── Semana ────────────────────────────────────────────────
export async function getWeekAssignment(weekStart: string): Promise<number | null> {
  const rows = await db
    .select()
    .from(weekAssignments)
    .where(eq(weekAssignments.weekStart, weekStart))
    .limit(1);
  return rows[0]?.routineId ?? null;
}

export async function setWeekAssignment(weekStart: string, routineId: number | null): Promise<void> {
  if (routineId == null) {
    await db.delete(weekAssignments).where(eq(weekAssignments.weekStart, weekStart));
    return;
  }
  const existing = await db
    .select()
    .from(weekAssignments)
    .where(eq(weekAssignments.weekStart, weekStart))
    .limit(1);
  if (existing[0]) {
    await db.update(weekAssignments).set({ routineId }).where(eq(weekAssignments.weekStart, weekStart));
  } else {
    await db.insert(weekAssignments).values({ weekStart, routineId });
  }
}

export async function listWeekAssignments(): Promise<Array<{ weekStart: string; routineId: number }>> {
  const rows = await db.select().from(weekAssignments);
  return rows.map((r) => ({ weekStart: r.weekStart, routineId: r.routineId }));
}
