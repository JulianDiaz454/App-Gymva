import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BackIcon, ChevronIcon, PlusIcon } from '@/components/AppIcons';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import {
  getRoutineFull,
  listRoutines,
  type RoutineFull,
} from '@/db/queries/routines';
import type { Routine } from '@/db/schema';
import { colors, radii, space } from '@/theme/tokens';
import { formatNumber } from '@/utils/format';

const DAY_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

export default function RoutinesListScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [full, setFull] = useState<Map<number, RoutineFull>>(new Map());

  const load = useCallback(async () => {
    const list = await listRoutines();
    setRoutines(list);
    const fullMap = new Map<number, RoutineFull>();
    for (const r of list) {
      const f = await getRoutineFull(r.id);
      if (f) fullMap.set(r.id, f);
    }
    setFull(fullMap);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <IconButton onPress={() => router.back()}>
          <BackIcon size={18} color={colors.text} />
        </IconButton>
      </View>
      <Header
        eyebrow="Plantillas semanales"
        title="Rutinas"
        right={
          <IconButton variant="primary" size={44} onPress={() => router.push('/routine-editor')}>
            <PlusIcon size={20} color={colors.bg} />
          </IconButton>
        }
      />
      <View style={{ paddingHorizontal: space.xl }}>
        <Text variant="caption" tone="secondary">
          Define una plantilla con los ejercicios de cada día y asígnala a una semana del calendario.
        </Text>
      </View>

      <View style={{ padding: space.xl, gap: 10 }}>
        {routines.map((r) => {
          const f = full.get(r.id);
          const trainingDays = f?.days.filter((d) => d.label).length ?? 0;
          const totalEx = f?.days.reduce((s, d) => s + d.exercises.length, 0) ?? 0;
          return (
            <Pressable
              key={r.id}
              onPress={() => router.push({ pathname: '/routine-editor', params: { id: String(r.id) } })}
              style={styles.card}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <View
                  style={[
                    styles.colorTile,
                    { backgroundColor: r.color },
                  ]}
                >
                  <Text style={styles.colorTileNum} tabular>{trainingDays}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={{ fontSize: 17, fontWeight: '700' }}>
                    {r.name}
                  </Text>
                  <Text variant="micro" tone="secondary" style={{ marginTop: 2 }}>
                    {formatNumber(trainingDays)} días · {formatNumber(totalEx)} ejercicios
                  </Text>
                </View>
                <ChevronIcon size={14} color={colors.textMut} dir="right" />
              </View>
              <View style={styles.weekStrip}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const day = f?.days.find((d) => d.dayOfWeek === i);
                  const hasDay = day?.label != null;
                  return (
                    <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                      <Text
                        variant="micro"
                        tone="muted"
                        style={{ fontSize: 9, fontWeight: '600', marginBottom: 4 }}
                      >
                        {DAY_SHORT[i]}
                      </Text>
                      <View
                        style={[
                          styles.dayPill,
                          {
                            backgroundColor: hasDay ? r.color : colors.raised,
                            opacity: hasDay ? 0.85 : 1,
                          },
                        ]}
                      >
                        <Text
                          tabular
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: hasDay ? colors.bg : colors.textMut,
                          }}
                        >
                          {hasDay ? day?.exercises.length ?? 0 : '·'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Pressable>
          );
        })}

        {routines.length === 0 ? (
          <View style={[styles.card, { padding: 28, alignItems: 'center', gap: 14 }]}>
            <Text variant="caption" tone="secondary">Aún no tienes rutinas</Text>
            <Button
              label="Crear primera rutina"
              variant="ghost"
              leftIcon={<PlusIcon size={14} color={colors.text} />}
              onPress={() => router.push('/routine-editor')}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 16,
  },
  colorTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  colorTileNum: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.bg,
    letterSpacing: -0.4,
  },
  weekStrip: {
    flexDirection: 'row',
    gap: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  dayPill: {
    height: 22,
    width: '100%',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
