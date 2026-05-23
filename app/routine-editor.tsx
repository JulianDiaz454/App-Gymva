import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function RoutineEditorScreen() {
  return (
    <Screen>
      <EmptyState
        emoji="📋"
        title="Editor de rutina"
        message="Se implementa en la Fase 3."
        action={<Button label="Cerrar" variant="ghost" onPress={() => router.back()} />}
      />
    </Screen>
  );
}
