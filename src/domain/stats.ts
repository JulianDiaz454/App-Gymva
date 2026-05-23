/**
 * Cálculos puros sobre datos realizados. ESPECIFICACION §5.
 * Volumen = Σ(weight × reps). Peso máximo = max(weight).
 * Funciones puras y testeables; no leen de la BD.
 */

import type { SetRow } from '@/db/schema';

export function blockVolume(setRows: SetRow[]): number {
  return setRows.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

export function blockTopWeight(setRows: SetRow[]): number {
  if (setRows.length === 0) return 0;
  return setRows.reduce((max, s) => (s.weight > max ? s.weight : max), 0);
}

export function blockTotalReps(setRows: SetRow[]): number {
  return setRows.reduce((sum, s) => sum + s.reps, 0);
}
