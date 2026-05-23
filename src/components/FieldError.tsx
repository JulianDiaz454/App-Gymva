import { Text } from './Text';

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <Text variant="micro" tone="bad" style={{ marginTop: 6 }}>
      {message}
    </Text>
  );
}
