/**
 * Queries de sesiones (lo REALIZADO).
 * Mantiene la separación estricta con rutinas (lo planeado): aquí solo se
 * persiste lo que ocurrió realmente, con validación previa de cada serie.
 */

import { and, asc, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  sessions,
  sessionExercises,
  sets,
  type Session,
  type SessionExercise,
  type SetRow,
} from '@/db/schema';
import {
  formatZodErrors,
  isoDateSchema,
  notFutureDateSchema,
  setInputSchema,
  type SetInput,
} from '@/validation/schemas';
import { runMutation, type MutationResult } from './result';

export type SessionFull = Session & {
  blocks: Array<
    SessionExercise & {
      sets: SetRow[];
    }
  >;
};

export async function createSession(input: {
  date: string;
  routineDayId?: number | null;
  notes?: string;
}): Promise<{ ok: true; session: Session } | { ok: false; errors: Record<string, string> }> {
  const parsed = notFutureDateSchema.safeParse(input.date);
  if (!parsed.success) {
    return {
      ok: false,
      errors: { date: parsed.error.issues[0]?.message ?? 'Fecha inválida' },
    };
  }
  const [row] = await db
    .insert(sessions)
    .values({
      date: parsed.data,
      routineDayId: input.routineDayId ?? null,
      notes: input.notes ?? null,
    })
    .returning();
  if (!row) return { ok: false, errors: { _form: 'No se pudo crear la sesión' } };
  return { ok: true, session: row };
}

export async function ensureSessionBlock(opts: {
  sessionId: number;
  exerciseId: number;
  wasPlanned: boolean;
  order?: number;
}): Promise<SessionExercise> {
  const existing = await db
    .select()
    .from(sessionExercises)
    .where(
      and(
        eq(sessionExercises.sessionId, opts.sessionId),
        eq(sessionExercises.exerciseId, opts.exerciseId),
      ),
    )
    .limit(1);
  if (existing[0]) return existing[0];

  const [row] = await db
    .insert(sessionExercises)
    .values({
      sessionId: opts.sessionId,
      exerciseId: opts.exerciseId,
      wasPlanned: opts.wasPlanned,
      order: opts.order ?? 0,
      skipped: false,
    })
    .returning();
  if (!row) throw new Error('No se pudo crear el bloque de ejercicio');
  return row;
}

export async function setSkipped(sessionExerciseId: number, skipped: boolean): Promise<MutationResult> {
  return runMutation(() =>
    db.update(sessionExercises).set({ skipped }).where(eq(sessionExercises.id, sessionExerciseId)),
  );
}

export async function replaceSessionExercise(
  sessionExerciseId: number,
  newExerciseId: number,
): Promise<MutationResult> {
  // Borra sets previos (las series del ejercicio sustituido no son del nuevo).
  return runMutation(async () => {
    await db.delete(sets).where(eq(sets.sessionExerciseId, sessionExerciseId));
    await db
      .update(sessionExercises)
      .set({ exerciseId: newExerciseId, skipped: false })
      .where(eq(sessionExercises.id, sessionExerciseId));
  });
}

export type LogSetResult =
  | { ok: true; set: SetRow }
  | { ok: false; errors: Record<string, string> };

export async function logSet(opts: {
  sessionExerciseId: number;
  setNumber: number;
  weight: number;
  reps: number;
}): Promise<LogSetResult> {
  const parsed = setInputSchema.safeParse({ weight: opts.weight, reps: opts.reps });
  if (!parsed.success) return { ok: false, errors: formatZodErrors(parsed) };
  const [row] = await db
    .insert(sets)
    .values({
      sessionExerciseId: opts.sessionExerciseId,
      setNumber: opts.setNumber,
      weight: parsed.data.weight,
      reps: parsed.data.reps,
    })
    .returning();
  if (!row) return { ok: false, errors: { _form: 'No se pudo guardar la serie' } };
  return { ok: true, set: row };
}

export async function updateSet(
  setId: number,
  input: SetInput,
): Promise<LogSetResult> {
  const parsed = setInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: formatZodErrors(parsed) };
  const [row] = await db
    .update(sets)
    .set({ weight: parsed.data.weight, reps: parsed.data.reps })
    .where(eq(sets.id, setId))
    .returning();
  if (!row) return { ok: false, errors: { _form: 'Serie no encontrada' } };
  return { ok: true, set: row };
}

export async function deleteSet(setId: number): Promise<MutationResult> {
  return runMutation(() => db.delete(sets).where(eq(sets.id, setId)));
}

export async function getSessionBlocks(sessionId: number): Promise<
  Array<SessionExercise & { sets: SetRow[] }>
> {
  const blocks = await db
    .select()
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(asc(sessionExercises.order));
  if (blocks.length === 0) return [];

  const ids = blocks.map((b) => b.id);
  const allBySession = await db
    .select()
    .from(sets)
    .where(sql`${sets.sessionExerciseId} in (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})`)
    .orderBy(asc(sets.sessionExerciseId), asc(sets.setNumber));

  const byBlock = new Map<number, SetRow[]>();
  for (const s of allBySession) {
    const arr = byBlock.get(s.sessionExerciseId) ?? [];
    arr.push(s);
    byBlock.set(s.sessionExerciseId, arr);
  }
  return blocks.map((b) => ({ ...b, sets: byBlock.get(b.id) ?? [] }));
}

export async function getSession(sessionId: number): Promise<SessionFull | null> {
  const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  const s = session[0];
  if (!s) return null;
  const blocks = await getSessionBlocks(sessionId);
  return { ...s, blocks };
}

export async function getSessionForDate(date: string): Promise<SessionFull | null> {
  const parsed = isoDateSchema.safeParse(date);
  if (!parsed.success) return null;
  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.date, parsed.data))
    .orderBy(desc(sessions.createdAt))
    .limit(1);
  const s = rows[0];
  if (!s) return null;
  const blocks = await getSessionBlocks(s.id);
  return { ...s, blocks };
}

export async function listSessions(): Promise<Session[]> {
  return db.select().from(sessions).orderBy(desc(sessions.date));
}

export async function deleteSession(id: number): Promise<MutationResult> {
  return runMutation(() => db.delete(sessions).where(eq(sessions.id, id)));
}
