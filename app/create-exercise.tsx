import { router } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';

export default function CreateExerciseScreen() {
  return (
    <Screen>
      <EmptyState
        emoji="✨"
        title="Crear ejercicio"
        message="Se implementa en la Fase 1."
        action={<Button label="Cerrar" variant="ghost" onPress={() => router.back()} />}
      />
    </Screen>
  );
}
