/**
 * Queries para gráficas de progreso (ESPECIFICACION §5).
 * Solo lee de tablas REALIZADAS (sessions, session_exercises, sets).
 * Métricas conmutables: volumen total y peso máximo por sesión.
 */

import { and, asc, eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, sessionExercises, sessions, sets } from '@/db/schema';

export interface ExerciseSessionPoint {
  date: string;
  sessionId: number;
  topWeight: number;
  volume: number;
  totalReps: number;
  setCount: number;
}

export async function getExerciseHistory(exerciseId: number): Promise<ExerciseSessionPoint[]> {
  // join: sets -> session_exercises -> sessions filtered by exerciseId
  const rows = await db
    .select({
      date: sessions.date,
      sessionId: sessions.id,
      weight: sets.weight,
      reps: sets.reps,
    })
    .from(sets)
    .innerJoin(sessionExercises, eq(sessionExercises.id, sets.sessionExerciseId))
    .innerJoin(sessions, eq(sessions.id, sessionExercises.sessionId))
    .where(and(eq(sessionExercises.exerciseId, exerciseId), eq(sessionExercises.skipped, false)))
    .orderBy(asc(sessions.date));

  const bySession = new Map<number, ExerciseSessionPoint>();
  for (const r of rows) {
    const cur = bySession.get(r.sessionId);
    if (cur) {
      cur.topWeight = Math.max(cur.topWeight, r.weight);
      cur.volume += r.weight * r.reps;
      cur.totalReps += r.reps;
      cur.setCount += 1;
    } else {
      bySession.set(r.sessionId, {
        date: r.date,
        sessionId: r.sessionId,
        topWeight: r.weight,
        volume: r.weight * r.reps,
        totalReps: r.reps,
        setCount: 1,
      });
    }
  }
  return Array.from(bySession.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export interface ExerciseStat {
  exerciseId: number;
  name: string;
  icon: string;
  color: string;
  muscleGroup: string | null;
  sessionCount: number;
  lastTopWeight: number;
  prevTopWeight: number;
  lastDate: string | null;
}

export async function listExercisesWithStats(): Promise<ExerciseStat[]> {
  const allExercises = await db.select().from(exercises);
  const results: ExerciseStat[] = [];
  for (const ex of allExercises) {
    const history = await getExerciseHistory(ex.id);
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    results.push({
      exerciseId: ex.id,
      name: ex.name,
      icon: ex.icon,
      color: ex.color,
      muscleGroup: ex.muscleGroup,
      sessionCount: history.length,
      lastTopWeight: last?.topWeight ?? 0,
      prevTopWeight: prev?.topWeight ?? 0,
      lastDate: last?.date ?? null,
    });
  }
  return results;
}

export async function getTotalsForDate(date: string): Promise<{
  volume: number;
  setCount: number;
  exerciseCount: number;
}> {
  const rows = await db
    .select({
      weight: sets.weight,
      reps: sets.reps,
      exerciseId: sessionExercises.exerciseId,
    })
    .from(sets)
    .innerJoin(sessionExercises, eq(sessionExercises.id, sets.sessionExerciseId))
    .innerJoin(sessions, eq(sessions.id, sessionExercises.sessionId))
    .where(eq(sessions.date, date));
  let volume = 0;
  const exIds = new Set<number>();
  for (const r of rows) {
    volume += r.weight * r.reps;
    exIds.add(r.exerciseId);
  }
  return { volume, setCount: rows.length, exerciseCount: exIds.size };
}
