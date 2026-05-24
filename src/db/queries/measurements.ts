/**
 * Queries para medidas corporales y fotos.
 */

import { asc, desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  measurementEntries,
  measurementTypes,
  progressPhotos,
  type MeasurementEntry,
  type MeasurementType,
  type ProgressPhoto,
} from '@/db/schema';
import {
  formatZodErrors,
  measurementEntryInputSchema,
  measurementTypeInputSchema,
  type MeasurementEntryInput,
  type MeasurementTypeInput,
} from '@/validation/schemas';
import { runMutation, type MutationResult } from './result';

export async function listMeasurementTypes(): Promise<MeasurementType[]> {
  return db.select().from(measurementTypes).orderBy(asc(measurementTypes.name));
}

export async function createMeasurementType(
  input: MeasurementTypeInput,
): Promise<
  | { ok: true; type: MeasurementType }
  | { ok: false; errors: Record<string, string> }
> {
  const parsed = measurementTypeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: formatZodErrors(parsed) };
  try {
    const [row] = await db.insert(measurementTypes).values(parsed.data).returning();
    if (!row) return { ok: false, errors: { _form: 'No se pudo crear la medida' } };
    return { ok: true, type: row };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes('unique')) {
      return { ok: false, errors: { name: 'Ya existe una medida con ese nombre' } };
    }
    return { ok: false, errors: { _form: msg } };
  }
}

export async function deleteMeasurementType(id: number): Promise<MutationResult> {
  return runMutation(() => db.delete(measurementTypes).where(eq(measurementTypes.id, id)));
}

export async function listMeasurementEntries(typeId: number): Promise<MeasurementEntry[]> {
  return db
    .select()
    .from(measurementEntries)
    .where(eq(measurementEntries.measurementTypeId, typeId))
    .orderBy(asc(measurementEntries.date));
}

export async function addMeasurementEntry(
  input: MeasurementEntryInput,
): Promise<
  | { ok: true; entry: MeasurementEntry }
  | { ok: false; errors: Record<string, string> }
> {
  const parsed = measurementEntryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: formatZodErrors(parsed) };
  const [row] = await db.insert(measurementEntries).values(parsed.data).returning();
  if (!row) return { ok: false, errors: { _form: 'No se pudo registrar' } };
  return { ok: true, entry: row };
}

export async function deleteMeasurementEntry(id: number): Promise<MutationResult> {
  return runMutation(() => db.delete(measurementEntries).where(eq(measurementEntries.id, id)));
}

// ── Fotos ────────────────────────────────────────
export async function listPhotos(): Promise<ProgressPhoto[]> {
  return db.select().from(progressPhotos).orderBy(desc(progressPhotos.date));
}

export async function addPhoto(opts: {
  filePath: string;
  date: string;
  measurementEntryId?: number | null;
  notes?: string | null;
}): Promise<ProgressPhoto> {
  const [row] = await db
    .insert(progressPhotos)
    .values({
      filePath: opts.filePath,
      date: opts.date,
      measurementEntryId: opts.measurementEntryId ?? null,
      notes: opts.notes ?? null,
    })
    .returning();
  if (!row) throw new Error('No se pudo guardar la foto');
  return row;
}

export async function deletePhoto(id: number): Promise<MutationResult> {
  return runMutation(() => db.delete(progressPhotos).where(eq(progressPhotos.id, id)));
}
