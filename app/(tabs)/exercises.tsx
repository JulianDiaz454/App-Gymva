import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { ChevronIcon, PlusIcon, SearchIcon } from '@/components/AppIcons';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { Header } from '@/components/Header';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { listExercises } from '@/db/queries/exercises';
import type { Exercise } from '@/db/schema';
import { colors, radii, space } from '@/theme/tokens';

const ALL = 'Todos';

export default function ExercisesTab() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>(ALL);

  useFocusEffect(
    useCallback(() => {
      listExercises().then(setExercises);
    }, []),
  );

  const muscles = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const ex of exercises) {
      if (ex.muscleGroup) set.add(ex.muscleGroup);
    }
    return [ALL, ...Array.from(set)];
  }, [exercises]);

  const filtered = useMemo(() => {
    return exercises.filter(
      (e) =>
        (filter === ALL || e.muscleGroup === filter) &&
        e.name.toLowerCase().includes(query.toLowerCase()),
    );
  }, [exercises, filter, query]);

  const groups = useMemo(() => {
    const m = new Map<string, Exercise[]>();
    for (const ex of filtered) {
      const key = ex.muscleGroup ?? 'Sin grupo';
      const list = m.get(key) ?? [];
      list.push(ex);
      m.set(key, list);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const goCreate = () => router.push({ pathname: '/create-exercise', params: { initialName: query } });

  return (
    <Screen>
      <Header
        eyebrow={`${exercises.length} en biblioteca`}
        title="Ejercicios"
        right={
          <IconButton variant="primary" size={44} onPress={() => router.push('/create-exercise')}>
            <PlusIcon size={20} color={colors.bg} />
          </IconButton>
        }
      />

      {/* Search */}
      <View style={{ paddingHorizontal: space.xl, paddingTop: space.md }}>
        <View style={styles.search}>
          <SearchIcon size={16} color={colors.textMut} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar ejercicio"
            placeholderTextColor={colors.textMut}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {muscles.map((m) => {
          const active = filter === m;
          return (
            <Pressable
              key={m}
              onPress={() => setFilter(m)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.text : colors.surface,
                },
              ]}
            >
              <Text
                variant="caption"
                style={{ color: active ? colors.bg : colors.textSec, fontWeight: '600' }}
              >
                {m}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Groups */}
      <View style={{ paddingHorizontal: space.xl, paddingTop: space.md }}>
        {groups.map(([muscle, list]) => (
          <View key={muscle} style={{ marginBottom: 18 }}>
            <Text variant="section" tone="muted" style={{ marginBottom: 10 }}>
              {muscle}
            </Text>
            <View style={styles.groupCard}>
              {list.map((ex, i) => (
                <Pressable
                  key={ex.id}
                  onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: ex.id } })}
                  style={[
                    styles.row,
                    i !== list.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
                  ]}
                >
                  <ExerciseIcon icon={ex.icon} color={ex.color} size="sm" />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{ex.name}</Text>
                    {ex.equipment ? (
                      <Text variant="micro" tone="muted" style={{ marginTop: 2 }}>
                        {ex.equipment}
                      </Text>
                    ) : null}
                  </View>
                  <ChevronIcon size={12} color={colors.textMut} dir="right" />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
            <Text variant="caption" tone="secondary">
              {exercises.length === 0 ? 'Tu catálogo está vacío' : 'No hay ejercicios que coincidan'}
            </Text>
            <Button
              label={query.trim().length > 0 ? `Crear "${query.trim()}"` : 'Crear primer ejercicio'}
              variant="ghost"
              leftIcon={<PlusIcon size={14} color={colors.text} />}
              onPress={goCreate}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: colors.text,
    fontSize: 14,
  },
  filterRow: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: 4,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: space.lg,
    paddingVertical: 12,
  },
});
