import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function CalendarTab() {
  return (
    <Screen>
      <Header eyebrow="2026" title="Calendario" />
      <EmptyState
        emoji="📅"
        title="Sin sesiones"
        message="El calendario mostrará tus entrenamientos planeados y realizados."
      />
    </Screen>
  );
}
