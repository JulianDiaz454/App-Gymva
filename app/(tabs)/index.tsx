import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';

export default function TodayScreen() {
  return (
    <Screen>
      <EmptyState
        emoji="🧘"
        title="Día de descanso"
        message="Aún no hay rutina activa. Crea una en la pestaña Ejercicios > Rutinas para empezar."
        action={<Button label="Entrenar libre" variant="ghost" />}
      />
    </Screen>
  );
}
