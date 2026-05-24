import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronIcon } from '@/components/AppIcons';
import { EmptyState } from '@/components/EmptyState';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { StaggerItem } from '@/components/StaggerItem';
import { Text } from '@/components/Text';
import { listExercisesWithStats, type ExerciseStat } from '@/db/queries/progress';
import { colors, space } from '@/theme/tokens';
import { formatNumber } from '@/utils/format';

export default function ProgressTab() {
  const [items, setItems] = useState<ExerciseStat[]>([]);

  useFocusEffect(
    useCallback(() => {
      listExercisesWithStats()
        .then((rows) => setItems(rows.filter((r) => r.sessionCount > 0)))
        .catch((e) => console.warn('listExercisesWithStats:', e));
    }, []),
  );

  if (items.length === 0) {
    return (
      <Screen>
        <Header eyebrow="Tu progreso" title="Levantamiento" />
        <EmptyState
          emoji="📊"
          title="Sin datos todavía"
          message="Las gráficas aparecen cuando registras al menos una serie con peso y reps en la pestaña Hoy. Saltar un ejercicio no cuenta como dato."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header eyebrow="Tu progreso" title="Levantamiento" />
      <View style={{ paddingHorizontal: space.xl, marginTop: -8, marginBottom: 16 }}>
        <Text variant="caption" tone="secondary">
          Selecciona un ejercicio para ver su evolución
        </Text>
      </View>

      <View style={{ paddingHorizontal: space.xl, gap: 8 }}>
        {items.map((it, idx) => {
          const change =
            it.prevTopWeight > 0 ? ((it.lastTopWeight - it.prevTopWeight) / it.prevTopWeight) * 100 : 0;
          const positive = change > 0;
          const neutral = change === 0;
          return (
            <StaggerItem key={it.exerciseId} index={idx}>
            <Pressable
              onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: String(it.exerciseId) } })}
              style={styles.row}
            >
              <ExerciseIcon icon={it.icon} color={it.color} size="sm" />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{it.name}</Text>
                <Text variant="micro" tone="muted" tabular>
                  Último {formatNumber(it.lastTopWeight)} kg · {it.sessionCount} ses.
                </Text>
              </View>
              {it.prevTopWeight > 0 ? (
                <Text
                  tabular
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: positive ? colors.ok : neutral ? colors.textMut : colors.bad,
                    marginRight: 4,
                  }}
                >
                  {positive ? '+' : ''}
                  {formatNumber(change, { decimals: 1 })}%
                </Text>
              ) : null}
              <ChevronIcon size={12} color={colors.textMut} dir="right" />
            </Pressable>
            </StaggerItem>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 18,
  },
});
