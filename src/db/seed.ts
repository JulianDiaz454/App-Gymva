/**
 * Seed mínimo de desarrollo (medidas corporales por defecto).
 * Solo crea datos si la BD está vacía. La app de producción arranca vacía.
 */

import { db, schema } from './client';
import { sql } from 'drizzle-orm';

const DEFAULT_MEASUREMENTS: Array<{ name: string; unit: string; icon: string }> = [
  { name: 'Peso corporal', unit: 'kg', icon: '⚖️' },
  { name: 'Cintura', unit: 'cm', icon: '📏' },
  { name: 'Pecho', unit: 'cm', icon: '🫀' },
  { name: 'Bíceps', unit: 'cm', icon: '💪' },
];

export async function seedDefaultsIfEmpty(): Promise<void> {
  const measurementsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.measurementTypes);

  const c = measurementsCount[0]?.count ?? 0;
  if (c === 0) {
    await db.insert(schema.measurementTypes).values(DEFAULT_MEASUREMENTS);
  }
}
