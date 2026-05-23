import { asc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, type Exercise, type NewExercise } from '@/db/schema';
import { exerciseInputSchema, formatZodErrors, type ExerciseInput } from '@/validation/schemas';

export async function listExercises(): Promise<Exercise[]> {
  return db.select().from(exercises).orderBy(asc(exercises.name));
}

export async function getExercise(id: number): Promise<Exercise | null> {
  const rows = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
  return rows[0] ?? null;
}

export type CreateExerciseResult =
  | { ok: true; exercise: Exercise }
  | { ok: false; errors: Record<string, string> };

export async function createExercise(input: ExerciseInput): Promise<CreateExerciseResult> {
  const parsed = exerciseInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: formatZodErrors(parsed) };

  const data = parsed.data;
  const insert: NewExercise = {
    name: data.name,
    icon: data.icon,
    color: data.color,
    muscleGroup: data.muscleGroup?.trim() || null,
    equipment: data.equipment?.trim() || null,
    notes: data.notes?.trim() || null,
  };

  try {
    const [row] = await db.insert(exercises).values(insert).returning();
    if (!row) return { ok: false, errors: { _form: 'No se pudo crear el ejercicio' } };
    return { ok: true, exercise: row };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('UNIQUE') || msg.toLowerCase().includes('unique')) {
      return { ok: false, errors: { name: 'Ya existe un ejercicio con ese nombre' } };
    }
    return { ok: false, errors: { _form: msg } };
  }
}

export async function updateExercise(
  id: number,
  input: ExerciseInput,
): Promise<CreateExerciseResult> {
  const parsed = exerciseInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: formatZodErrors(parsed) };
  const data = parsed.data;
  try {
    const [row] = await db
      .update(exercises)
      .set({
        name: data.name,
        icon: data.icon,
        color: data.color,
        muscleGroup: data.muscleGroup?.trim() || null,
        equipment: data.equipment?.trim() || null,
        notes: data.notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(exercises.id, id))
      .returning();
    if (!row) return { ok: false, errors: { _form: 'Ejercicio no encontrado' } };
    return { ok: true, exercise: row };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('UNIQUE') || msg.toLowerCase().includes('unique')) {
      return { ok: false, errors: { name: 'Ya existe un ejercicio con ese nombre' } };
    }
    return { ok: false, errors: { _form: msg } };
  }
}

export async function deleteExercise(id: number): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.delete(exercises).where(eq(exercises.id, id));
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes('foreign')) {
      return { ok: false, error: 'No se puede borrar: hay rutinas o sesiones que lo usan' };
    }
    return { ok: false, error: msg };
  }
}
