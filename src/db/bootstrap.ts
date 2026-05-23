/**
 * Bootstrap del esquema en SQLite.
 * Como Drizzle Kit genera migraciones para entornos node, en runtime ejecutamos
 * los CREATE TABLE IF NOT EXISTS directamente. Esto garantiza que la app arranca
 * con la estructura correcta sin depender del flujo de migraciones nativo.
 *
 * DECISIÓN: en una v1 sin múltiples usuarios, es más simple y robusto crear el
 * esquema por idempotencia que mantener un sistema de migraciones. Cuando aparezca
 * v2 con cambios destructivos, se introducirá un sistema de versionado explícito.
 */

import { db } from './client';
import { sql } from 'drizzle-orm';

const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    muscle_group TEXT,
    equipment TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS exercises_name_unique ON exercises (name);`,

  `CREATE TABLE IF NOT EXISTS routines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#60A5FA',
    is_active INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );`,

  `CREATE TABLE IF NOT EXISTS routine_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    label TEXT
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS routine_days_unique ON routine_days (routine_id, day_of_week);`,

  `CREATE TABLE IF NOT EXISTS routine_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_day_id INTEGER NOT NULL REFERENCES routine_days(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    target_sets INTEGER NOT NULL,
    target_reps INTEGER NOT NULL,
    target_weight REAL,
    "order" INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE INDEX IF NOT EXISTS routine_exercises_day_idx ON routine_exercises (routine_day_id);`,

  `CREATE TABLE IF NOT EXISTS week_assignments (
    week_start TEXT PRIMARY KEY,
    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );`,

  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    routine_day_id INTEGER REFERENCES routine_days(id) ON DELETE SET NULL,
    notes TEXT,
    duration_seconds INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );`,
  `CREATE INDEX IF NOT EXISTS sessions_date_idx ON sessions (date);`,

  `CREATE TABLE IF NOT EXISTS session_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    was_planned INTEGER NOT NULL DEFAULT 0,
    skipped INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE INDEX IF NOT EXISTS session_exercises_session_idx ON session_exercises (session_id);`,
  `CREATE INDEX IF NOT EXISTS session_exercises_exercise_idx ON session_exercises (exercise_id);`,

  `CREATE TABLE IF NOT EXISTS sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_exercise_id INTEGER NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    weight REAL NOT NULL,
    reps INTEGER NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS sets_session_exercise_idx ON sets (session_exercise_id);`,

  `CREATE TABLE IF NOT EXISTS measurement_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '📏',
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS measurement_types_name_unique ON measurement_types (name);`,

  `CREATE TABLE IF NOT EXISTS measurement_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    measurement_type_id INTEGER NOT NULL REFERENCES measurement_types(id) ON DELETE CASCADE,
    value REAL NOT NULL,
    date TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );`,
  `CREATE INDEX IF NOT EXISTS measurement_entries_type_date_idx ON measurement_entries (measurement_type_id, date);`,

  `CREATE TABLE IF NOT EXISTS progress_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL,
    date TEXT NOT NULL,
    measurement_entry_id INTEGER REFERENCES measurement_entries(id) ON DELETE SET NULL,
    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );`,
  `CREATE INDEX IF NOT EXISTS progress_photos_date_idx ON progress_photos (date);`,
];

let initialized = false;

export async function initDatabase(): Promise<void> {
  if (initialized) return;
  await db.run(sql`PRAGMA foreign_keys = ON;`);
  for (const stmt of STATEMENTS) {
    await db.run(sql.raw(stmt));
  }
  initialized = true;
}
