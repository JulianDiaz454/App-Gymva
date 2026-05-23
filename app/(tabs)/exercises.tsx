import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function ExercisesTab() {
  return (
    <Screen>
      <Header eyebrow="Biblioteca" title="Ejercicios" />
      <EmptyState
        emoji="💪"
        title="Sin ejercicios"
        message="Tu catálogo está vacío. Crea tu primer ejercicio para empezar."
      />
    </Screen>
  );
}
