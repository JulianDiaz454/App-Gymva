/**
 * Esquemas de validación con zod (ESPECIFICACION §7.1).
 * Centralizados — nunca validar disperso en componentes.
 * Mensajes en español, claros y no técnicos.
 */

import { z } from 'zod';

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ── Primitivos reusables ────────────────────────────────
export const weightSchema = z
  .number({ invalid_type_error: 'El peso debe ser un número' })
  .gt(0, 'El peso debe ser mayor que 0')
  .lte(1000, 'El peso no puede superar 1000 kg');

export const repsSchema = z
  .number({ invalid_type_error: 'Las reps deben ser un número' })
  .int('Las reps deben ser un entero')
  .gte(1, 'Las reps deben ser al menos 1')
  .lte(1000, 'Las reps no pueden superar 1000');

export const setsCountSchema = z
  .number({ invalid_type_error: 'Las series deben ser un número' })
  .int('Las series deben ser un entero')
  .gte(1, 'Las series deben ser al menos 1')
  .lte(100, 'Las series no pueden superar 100');

export const hexColorSchema = z
  .string()
  .regex(HEX_RE, 'Color inválido (usa #RRGGBB)');

export const isoDateSchema = z
  .string()
  .regex(ISO_DATE_RE, 'Fecha inválida (formato YYYY-MM-DD)')
  .refine((s) => !Number.isNaN(new Date(s + 'T00:00:00').getTime()), 'Fecha inválida');

export const notFutureDateSchema = isoDateSchema.refine((s) => {
  const d = new Date(s + 'T23:59:59');
  return d.getTime() <= Date.now();
}, 'La fecha no puede ser futura');

export const notesSchema = z
  .string()
  .max(500, 'Las notas no pueden superar 500 caracteres')
  .optional()
  .or(z.literal(''));

// ── Entidades ───────────────────────────────────────────
export const exerciseInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(60, 'El nombre no puede superar 60 caracteres'),
  icon: z.string().min(1, 'Elige un icono'),
  color: hexColorSchema,
  muscleGroup: z
    .string()
    .trim()
    .max(40, 'El grupo muscular no puede superar 40 caracteres')
    .optional()
    .or(z.literal('')),
  equipment: z
    .string()
    .trim()
    .max(40, 'El equipo no puede superar 40 caracteres')
    .optional()
    .or(z.literal('')),
  notes: notesSchema,
});
export type ExerciseInput = z.infer<typeof exerciseInputSchema>;

export const routineInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(60, 'El nombre no puede superar 60 caracteres'),
  color: hexColorSchema,
});
export type RoutineInput = z.infer<typeof routineInputSchema>;

export const routineDayInputSchema = z.object({
  dayOfWeek: z.number().int().gte(0).lte(6),
  label: z
    .string()
    .trim()
    .min(1, 'El nombre del día es obligatorio')
    .max(60, 'El nombre no puede superar 60 caracteres')
    .nullable(),
});
export type RoutineDayInput = z.infer<typeof routineDayInputSchema>;

export const routineExerciseInputSchema = z.object({
  exerciseId: z.number().int().positive(),
  targetSets: setsCountSchema,
  targetReps: repsSchema,
  targetWeight: weightSchema.optional().nullable(),
  order: z.number().int().gte(0),
});
export type RoutineExerciseInput = z.infer<typeof routineExerciseInputSchema>;

export const setInputSchema = z.object({
  weight: weightSchema,
  reps: repsSchema,
});
export type SetInput = z.infer<typeof setInputSchema>;

export const sessionInputSchema = z.object({
  date: notFutureDateSchema,
  routineDayId: z.number().int().positive().nullable(),
  notes: notesSchema,
});
export type SessionInput = z.infer<typeof sessionInputSchema>;

export const measurementTypeInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(40, 'El nombre no puede superar 40 caracteres'),
  unit: z
    .string()
    .trim()
    .min(1, 'La unidad es obligatoria')
    .max(6, 'La unidad no puede superar 6 caracteres'),
  icon: z.string().min(1, 'Elige un icono'),
});
export type MeasurementTypeInput = z.infer<typeof measurementTypeInputSchema>;

export const measurementEntryInputSchema = z.object({
  measurementTypeId: z.number().int().positive(),
  value: z.number().gt(0, 'El valor debe ser mayor que 0').lte(1000, 'Valor demasiado alto'),
  date: notFutureDateSchema,
});
export type MeasurementEntryInput = z.infer<typeof measurementEntryInputSchema>;

/** Devuelve un Record<field, errorMessage> a partir de un ZodError. */
export function formatZodErrors<T>(result: z.SafeParseError<T>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) errors[path] = issue.message;
  }
  return errors;
}
