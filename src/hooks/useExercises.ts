import { useCallback, useEffect, useState } from 'react';

import { listExercises } from '@/db/queries/exercises';
import type { Exercise } from '@/db/schema';

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listExercises();
    setExercises(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { exercises, loading, refresh };
}
