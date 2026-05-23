/**
 * Queries para el calendario: sesiones por mes y planeación derivada de
 * la rutina asignada a cada semana.
 */

import { and, asc, gte, lte } from 'drizzle-orm';

import { db } from '@/db/client';
import { sessionExercises, sessions, sets } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface SessionSummary {
  date: string;
  sessionId: number;
  exerciseCount: number;
  setCount: number;
  volume: number;
}

export async function listSessionsInMonth(
  year: number,
  month: number,
): Promise<SessionSummary[]> {
  const monthStr = String(month + 1).padStart(2, '0');
  const start = `${year}-${monthStr}-01`;
  const end = `${year}-${monthStr}-31`;
  const rows = await db
    .select()
    .from(sessions)
    .where(and(gte(sessions.date, start), lte(sessions.date, end)))
    .orderBy(asc(sessions.date));

  const summaries: SessionSummary[] = [];
  for (const s of rows) {
    const blocks = await db
      .select()
      .from(sessionExercises)
      .where(eq(sessionExercises.sessionId, s.id));
    const blockIds = blocks.map((b) => b.id);
    let volume = 0;
    let setCount = 0;
    for (const b of blocks) {
      const ss = await db.select().from(sets).where(eq(sets.sessionExerciseId, b.id));
      for (const r of ss) {
        volume += r.weight * r.reps;
        setCount += 1;
      }
    }
    void blockIds;
    summaries.push({
      date: s.date,
      sessionId: s.id,
      exerciseCount: blocks.length,
      setCount,
      volume,
    });
  }
  return summaries;
}
