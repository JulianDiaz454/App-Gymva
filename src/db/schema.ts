/**
 * Esquema Drizzle — mapea 1:1 ESPECIFICACION §3.
 * Separación estricta planeado (routine_*) vs realizado (session_*).
 */

import { sql } from 'drizzle-orm';
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
};

// ── 3.1 Catálogo de ejercicios ──────────────────────────────
export const exercises = sqliteTable(
  'exercises',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    icon: text('icon').notNull(),
    color: text('color').notNull(),
    muscleGroup: text('muscle_group'),
    equipment: text('equipment'),
    notes: text('notes'),
    // Soft-delete: archivado != borrado. Un ejercicio archivado desaparece del
    // catálogo y de los selectores, pero se conserva en rutinas e historial
    // (FK onDelete: 'restrict' impide el borrado físico si está referenciado).
    archivedAt: integer('archived_at', { mode: 'timestamp_ms' }),
    ...timestamps,
  },
  (t) => ({
    nameIdx: uniqueIndex('exercises_name_unique').on(t.name),
  }),
);

// ── 3.2 Rutinas ────────────────────────────────────────────
export const routines = sqliteTable('routines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#60A5FA'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
});

// ── 3.3 Días de una rutina ─────────────────────────────────
// day_of_week: 0=lunes ... 6=domingo
export const routineDays = sqliteTable(
  'routine_days',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    routineId: integer('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    label: text('label'),
  },
  (t) => ({
    routineDayIdx: uniqueIndex('routine_days_unique').on(t.routineId, t.dayOfWeek),
  }),
);

// ── 3.4 Ejercicios planeados en un día ─────────────────────
export const routineExercises = sqliteTable(
  'routine_exercises',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    routineDayId: integer('routine_day_id')
      .notNull()
      .references(() => routineDays.id, { onDelete: 'cascade' }),
    exerciseId: integer('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    targetSets: integer('target_sets').notNull(),
    targetReps: integer('target_reps').notNull(),
    targetWeight: real('target_weight'),
    order: integer('order').notNull().default(0),
  },
  (t) => ({
    dayIdx: index('routine_exercises_day_idx').on(t.routineDayId),
  }),
);

// ── Asignaciones de rutina a semana (lunes ISO → routineId) ─
export const weekAssignments = sqliteTable('week_assignments', {
  weekStart: text('week_start').primaryKey(), // YYYY-MM-DD del lunes
  routineId: integer('routine_id')
    .notNull()
    .references(() => routines.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── 3.5 Sesiones (lo REALIZADO) ────────────────────────────
export const sessions = sqliteTable(
  'sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(), // YYYY-MM-DD
    routineDayId: integer('routine_day_id').references(() => routineDays.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
    durationSeconds: integer('duration_seconds'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    dateIdx: index('sessions_date_idx').on(t.date),
  }),
);

// ── 3.6 Ejercicios realizados en la sesión ─────────────────
export const sessionExercises = sqliteTable(
  'session_exercises',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sessionId: integer('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    exerciseId: integer('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    wasPlanned: integer('was_planned', { mode: 'boolean' }).notNull().default(false),
    skipped: integer('skipped', { mode: 'boolean' }).notNull().default(false),
    order: integer('order').notNull().default(0),
  },
  (t) => ({
    sessionIdx: index('session_exercises_session_idx').on(t.sessionId),
    exerciseIdx: index('session_exercises_exercise_idx').on(t.exerciseId),
  }),
);

// ── 3.7 Series individuales (la base de TODAS las gráficas) ─
export const sets = sqliteTable(
  'sets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sessionExerciseId: integer('session_exercise_id')
      .notNull()
      .references(() => sessionExercises.id, { onDelete: 'cascade' }),
    setNumber: integer('set_number').notNull(),
    weight: real('weight').notNull(),
    reps: integer('reps').notNull(),
  },
  (t) => ({
    sessionExerciseIdx: index('sets_session_exercise_idx').on(t.sessionExerciseId),
  }),
);

// ── 3.8 Medidas corporales ─────────────────────────────────
export const measurementTypes = sqliteTable(
  'measurement_types',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    unit: text('unit').notNull(),
    icon: text('icon').notNull().default('📏'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    nameIdx: uniqueIndex('measurement_types_name_unique').on(t.name),
  }),
);

export const measurementEntries = sqliteTable(
  'measurement_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    measurementTypeId: integer('measurement_type_id')
      .notNull()
      .references(() => measurementTypes.id, { onDelete: 'cascade' }),
    value: real('value').notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    typeDateIdx: index('measurement_entries_type_date_idx').on(t.measurementTypeId, t.date),
  }),
);

// ── 3.9 Fotos de progreso ──────────────────────────────────
export const progressPhotos = sqliteTable(
  'progress_photos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    filePath: text('file_path').notNull(),
    date: text('date').notNull(),
    measurementEntryId: integer('measurement_entry_id').references(
      () => measurementEntries.id,
      { onDelete: 'set null' },
    ),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    dateIdx: index('progress_photos_date_idx').on(t.date),
  }),
);

// ── Tipos inferidos ────────────────────────────────────────
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Routine = typeof routines.$inferSelect;
export type NewRoutine = typeof routines.$inferInsert;
export type RoutineDay = typeof routineDays.$inferSelect;
export type NewRoutineDay = typeof routineDays.$inferInsert;
export type RoutineExercise = typeof routineExercises.$inferSelect;
export type NewRoutineExercise = typeof routineExercises.$inferInsert;
export type WeekAssignment = typeof weekAssignments.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SessionExercise = typeof sessionExercises.$inferSelect;
export type NewSessionExercise = typeof sessionExercises.$inferInsert;
export type SetRow = typeof sets.$inferSelect;
export type NewSetRow = typeof sets.$inferInsert;
export type MeasurementType = typeof measurementTypes.$inferSelect;
export type NewMeasurementType = typeof measurementTypes.$inferInsert;
export type MeasurementEntry = typeof measurementEntries.$inferSelect;
export type NewMeasurementEntry = typeof measurementEntries.$inferInsert;
export type ProgressPhoto = typeof progressPhotos.$inferSelect;
export type NewProgressPhoto = typeof progressPhotos.$inferInsert;
