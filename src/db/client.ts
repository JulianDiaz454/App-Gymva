import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const DB_NAME = 'gvm.db';

const sqlite = openDatabaseSync(DB_NAME, { enableChangeListener: true });

export const db: ExpoSQLiteDatabase<typeof schema> = drizzle(sqlite, { schema });

export { schema };
