import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function ProgressTab() {
  return (
    <Screen>
      <Header eyebrow="Tu progreso" title="Levantamiento" />
      <EmptyState
        emoji="📊"
        title="Sin datos todavía"
        message="Tus gráficas aparecerán aquí cuando registres tu primera sesión."
      />
    </Screen>
  );
}
