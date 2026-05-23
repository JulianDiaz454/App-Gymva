import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function SessionScreen() {
  return (
    <Screen>
      <EmptyState
        emoji="🏋️"
        title="Sesión"
        message="Se implementa en la Fase 2."
        action={<Button label="Cerrar" variant="ghost" onPress={() => router.back()} />}
      />
    </Screen>
  );
}
