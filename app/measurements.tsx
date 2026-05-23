import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function MeasurementsScreen() {
  return (
    <Screen>
      <EmptyState
        emoji="📏"
        title="Medidas"
        message="Se implementa en la Fase 4."
        action={<Button label="Cerrar" variant="ghost" onPress={() => router.back()} />}
      />
    </Screen>
  );
}
