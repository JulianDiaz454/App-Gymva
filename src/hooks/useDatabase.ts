import { useEffect, useState } from 'react';

import { initDatabase } from '@/db/bootstrap';
import { seedDefaultsIfEmpty } from '@/db/seed';

export function useDatabaseInit(): { ready: boolean; error: string | null } {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        await seedDefaultsIfEmpty();
        setReady(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      }
    })();
  }, []);

  return { ready, error };
}
