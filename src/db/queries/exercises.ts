import { asc, eq, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, type Exercise, type NewExercise } from '@/db/schema';
import { exerciseInputSchema, formatZodErrors, type ExerciseInput } from '@/validation/schemas';
import { runMutation, type MutationResult } from './result';

/**
 * Catálogo activo: excluye los archivados (soft-delete). Es la lista que se
 * muestra al usuario y la que alimenta los selectores de rutina/sesión.
 */
export async function listExercises(): Promise<Exercise[]> {
  return db
    .select()
    .from(exercises)
    .where(isNull(exercises.archivedAt))
    .orderBy(asc(exercises.name));
}

/**
 * TODOS los ejercicios, incluidos los archivados. Necesario para resolver el
 * nombre/icono de un ejercicio que sigue referenciado en rutinas o historial
 * (el merge de Hoy/Sesión y las pantallas de progreso) aunque ya no esté en el
 * catálogo activo.
 */
export async function listExercisesIncludingArchived(): Promise<Exercise[]> {
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

/**
 * Archiva (soft-delete) un ejercicio: lo saca del catálogo activo pero conserva
 * sus referencias en rutinas e historial. No usamos delete físico porque las FK
 * (routine_exercises / session_exercises) son onDelete: 'restrict'.
 */
export async function archiveExercise(id: number): Promise<MutationResult> {
  return runMutation(() =>
    db.update(exercises).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(exercises.id, id)),
  );
}

export async function unarchiveExercise(id: number): Promise<MutationResult> {
  return runMutation(() =>
    db.update(exercises).set({ archivedAt: null, updatedAt: new Date() }).where(eq(exercises.id, id)),
  );
}

export async function deleteExercise(id: number): Promise<MutationResult> {
  return runMutation(() => db.delete(exercises).where(eq(exercises.id, id)));
}
