import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function ExerciseDetailScreen() {
  return (
    <Screen>
      <EmptyState
        emoji="📈"
        title="Detalle de ejercicio"
        message="Se implementa en la Fase 4."
        action={<Button label="Volver" variant="ghost" onPress={() => router.back()} />}
      />
    </Screen>
  );
}
