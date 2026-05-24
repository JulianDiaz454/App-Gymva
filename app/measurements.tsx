import { router } from 'expo-router';
import { goBackSafe } from '@/utils/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackIcon, EditIcon, PlusIcon, TrashIcon } from '@/components/AppIcons';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FieldError } from '@/components/FieldError';
import { IconButton } from '@/components/IconButton';
import { LineChart } from '@/components/LineChart';
import { NumericKeypad, type KeyValue } from '@/components/NumericKeypad';
import { Text } from '@/components/Text';
import {
  addMeasurementEntry,
  createMeasurementType,
  deleteMeasurementEntry,
  deleteMeasurementType,
  listMeasurementEntries,
  listMeasurementTypes,
} from '@/db/queries/measurements';
import type { MeasurementEntry, MeasurementType } from '@/db/schema';
import { colors, radii, space } from '@/theme/tokens';
import { formatLongDate, todayIso } from '@/utils/date';
import { displayInputBuffer, formatNumber, parseDecimalInput } from '@/utils/format';

const UNIT_CHOICES = ['cm', 'kg', '%', 'mm', 'in'];
const ICON_CHOICES = ['📏', '💪', '🦵', '🫀', '🔥', '⚖️', '🎯', '📐', '🧍', '🏋️'];

export default function MeasurementsScreen() {
  const insets = useSafeAreaInsets();
  const [types, setTypes] = useState<MeasurementType[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [entries, setEntries] = useState<MeasurementEntry[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const [opError, setOpError] = useState<string | null>(null);
  const active = useMemo(() => types.find((t) => t.id === activeId) ?? null, [types, activeId]);

  const loadTypes = useCallback(async () => {
    try {
      const list = await listMeasurementTypes();
      setTypes(list);
      if (list.length > 0 && activeId == null) setActiveId(list[0]!.id);
    } catch (e) {
      console.warn('loadTypes:', e);
      setOpError('No se pudieron cargar las medidas.');
    }
  }, [activeId]);

  const loadEntries = useCallback(async (typeId: number) => {
    try {
      setEntries(await listMeasurementEntries(typeId));
    } catch (e) {
      console.warn('loadEntries:', e);
      setOpError('No se pudieron cargar los registros.');
    }
  }, []);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  useEffect(() => {
    if (activeId) loadEntries(activeId);
  }, [activeId, loadEntries]);

  const last = entries[entries.length - 1];
  const first = entries[0];
  const change = first && last ? last.value - first.value : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton onPress={goBackSafe}>
          <BackIcon size={18} color={colors.text} />
        </IconButton>
        <Text variant="bodyStrong">Peso y medidas</Text>
        <IconButton onPress={() => setConfigOpen(true)}>
          <EditIcon size={16} color={colors.text} />
        </IconButton>
      </View>

      {opError ? (
        <View style={{ paddingHorizontal: space.xl, paddingTop: 8 }}>
          <View style={styles.errorBox}>
            <Text variant="caption" tone="bad" style={{ flex: 1, fontWeight: '600' }}>{opError}</Text>
            <IconButton size={28} variant="transparent" onPress={() => setOpError(null)}>
              <Text variant="caption" tone="muted">✕</Text>
            </IconButton>
          </View>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 12) + 24 }} showsVerticalScrollIndicator={false}>
        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {types.map((t) => {
            const isActive = activeId === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setActiveId(t.id)}
                style={[
                  styles.tab,
                  { backgroundColor: isActive ? colors.text : colors.surface },
                ]}
              >
                <Text style={{ fontSize: 15 }}>{t.icon}</Text>
                <Text
                  variant="caption"
                  style={{ color: isActive ? colors.bg : colors.text, fontWeight: '600' }}
                >
                  {t.name}
                </Text>
              </Pressable>
            );
          })}
          <Pressable onPress={() => setConfigOpen(true)} style={[styles.tab, styles.tabDashed]}>
            <PlusIcon size={14} color={colors.textMut} />
            <Text variant="caption" tone="muted" style={{ fontWeight: '600' }}>
              Configurar
            </Text>
          </Pressable>
        </ScrollView>

        {active ? (
          <>
            {/* Hero */}
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Text style={{ fontSize: 30 }}>{active.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="title">{active.name}</Text>
                <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
                  {entries.length} registros
                </Text>
              </View>
            </View>

            {/* Big number */}
            <View style={{ paddingHorizontal: space.xl, paddingTop: 20 }}>
              <Text variant="eyebrow" tone="muted" style={{ marginBottom: 6 }}>
                Último registro
              </Text>
              <Text tabular style={styles.bigNum}>
                {last ? formatNumber(last.value) : '—'}
                <Text style={styles.unit}>  {active.unit}</Text>
              </Text>
              {first && last && first.id !== last.id ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <View style={styles.changePill}>
                    <Text
                      tabular
                      style={{ color: colors.ok, fontWeight: '600', fontSize: 12 }}
                    >
                      {change >= 0 ? '+' : ''}
                      {formatNumber(change, { decimals: 1 })} {active.unit}
                    </Text>
                  </View>
                  <Text variant="micro" tone="muted" style={{ textTransform: 'capitalize' }}>
                    desde {formatLongDate(first.date)}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Chart */}
            {entries.length >= 2 ? (
              <View style={{ paddingHorizontal: 8, paddingTop: 12 }}>
                <LineChart
                  values={entries.map((e) => e.value)}
                  dates={entries.map((e) => e.date)}
                  color={colors.text}
                  hoverIdx={entries.length - 1}
                />
              </View>
            ) : null}

            {/* History */}
            <View style={{ paddingHorizontal: space.xl, paddingTop: 24 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <Text variant="section" tone="muted">Historial</Text>
                <Button
                  label="Registrar"
                  variant="soft"
                  leftIcon={<PlusIcon size={13} color={colors.textSec} />}
                  onPress={() => setLogOpen(true)}
                />
              </View>
              <Card padding={4}>
                {entries.slice().reverse().map((h, i, arr) => (
                  <View
                    key={h.id}
                    style={[
                      styles.histRow,
                      i !== arr.length - 1 && { borderBottomColor: colors.borderSoft, borderBottomWidth: 1 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="caption" style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                        {formatLongDate(h.date)}
                      </Text>
                    </View>
                    <Text tabular variant="bodyStrong">
                      {formatNumber(h.value)}
                      <Text variant="micro" tone="muted">{` ${active.unit}`}</Text>
                    </Text>
                    <IconButton
                      size={28}
                      variant="transparent"
                      onPress={() => {
                        Alert.alert(
                          'Borrar registro',
                          `${formatNumber(h.value)} ${active.unit} del ${formatLongDate(h.date)}. Esta acción no se puede deshacer.`,
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                              text: 'Borrar',
                              style: 'destructive',
                              onPress: async () => {
                                setOpError(null);
                                const r = await deleteMeasurementEntry(h.id);
                                if (!r.ok) {
                                  setOpError(r.errors._form ?? 'No se pudo borrar el registro');
                                  return;
                                }
                                if (activeId) await loadEntries(activeId);
                              },
                            },
                          ],
                        );
                      }}
                    >
                      <TrashIcon size={14} color={colors.textMut} />
                    </IconButton>
                  </View>
                ))}
                {entries.length === 0 ? (
                  <Text tone="muted" variant="caption" style={{ textAlign: 'center', padding: 20 }}>
                    Sin registros todavía
                  </Text>
                ) : null}
              </Card>
            </View>
          </>
        ) : (
          <View style={{ alignItems: 'center', padding: 32, gap: 16 }}>
            <Text style={{ fontSize: 48 }}>📏</Text>
            <Text variant="title">Sin medidas configuradas</Text>
            <Button label="Añadir primera medida" variant="ghost" onPress={() => setConfigOpen(true)} />
          </View>
        )}
      </ScrollView>

      {/* Log sheet */}
      <BottomSheet
        visible={logOpen && active != null}
        onClose={() => setLogOpen(false)}
        eyebrow="Registrar"
        title={active?.name ?? ''}
        contentPadding={0}
      >
        {active ? (
          <LogEntryForm
            type={active}
            onSave={async (value) => {
              if (!active) return null;
              const r = await addMeasurementEntry({
                measurementTypeId: active.id,
                value,
                date: todayIso(),
              });
              if (!r.ok) {
                const firstKey = Object.keys(r.errors)[0];
                return (firstKey && r.errors[firstKey]) ?? 'No se pudo guardar';
              }
              await loadEntries(active.id);
              setLogOpen(false);
              return null;
            }}
          />
        ) : null}
      </BottomSheet>

      {/* Configure sheet */}
      <BottomSheet
        visible={configOpen}
        onClose={() => setConfigOpen(false)}
        eyebrow="Configurar"
        title="Tipos de medida"
        tall
        contentPadding={0}
      >
        <ConfigureForm
          types={types}
          onRefresh={loadTypes}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

function LogEntryForm({
  type,
  onSave,
}: {
  type: MeasurementType;
  /** Devuelve un mensaje de error si falla; null si OK. */
  onSave: (value: number) => Promise<string | null>;
}) {
  const [buf, setBuf] = useState<string>('0');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onKey = (k: KeyValue) => {
    let b = buf;
    if (k === 'back') {
      b = b.length > 0 ? b.slice(0, -1) : '';
      setBuf(b || '0');
      return;
    }
    if (k === '.') {
      if (!b.includes('.')) b = (b || '0') + '.';
      setBuf(b);
      return;
    }
    if (b === '0' || b === '') b = k;
    else b = (b + k).slice(0, 6);
    setBuf(b);
  };

  const save = async () => {
    if (saving) return;
    const parsed = parseDecimalInput(buf);
    if (parsed == null || parsed <= 0) {
      setError('Ingresa un valor mayor que 0');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const err = await onSave(parsed);
      if (err) setError(err);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <View style={{ alignItems: 'center', padding: 12 }}>
        <Text tabular style={styles.logBigNum}>
          {displayInputBuffer(buf)}
        </Text>
        <Text variant="caption" tone="muted">{type.unit}</Text>
        {error ? <FieldError message={error} /> : null}
      </View>
      <View style={{ paddingHorizontal: 8 }}>
        <NumericKeypad onKey={onKey} onSave={save} saveLabel={saving ? 'Guardando…' : 'Guardar'} />
      </View>
    </View>
  );
}

function ConfigureForm({
  types,
  onRefresh,
}: {
  types: MeasurementType[];
  onRefresh: () => Promise<void>;
}) {
  const [delError, setDelError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState<string>('cm');
  const [newIcon, setNewIcon] = useState<string>('📏');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const add = async () => {
    setErrors({});
    const r = await createMeasurementType({ name: newName.trim(), unit: newUnit, icon: newIcon });
    if (!r.ok) {
      setErrors(r.errors);
      return;
    }
    setNewName('');
    setAdding(false);
    await onRefresh();
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: space.xl, paddingBottom: 32 }}>
        {delError ? <FieldError message={delError} /> : null}
        {types.map((t) => (
          <View
            key={t.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              borderBottomColor: colors.borderSoft,
              borderBottomWidth: 1,
            }}
          >
            <View style={styles.cfgIcon}>
              <Text style={{ fontSize: 18 }}>{t.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{t.name}</Text>
              <Text variant="micro" tone="muted">Unidad: {t.unit}</Text>
            </View>
            <IconButton
              size={34}
              variant="transparent"
              onPress={async () => {
                setDelError(null);
                const r = await deleteMeasurementType(t.id);
                if (!r.ok) {
                  setDelError(r.errors._form ?? 'No se pudo borrar');
                  return;
                }
                await onRefresh();
              }}
            >
              <TrashIcon size={15} color={colors.textMut} />
            </IconButton>
          </View>
        ))}
        {!adding ? (
          <Pressable onPress={() => setAdding(true)} style={styles.addBtn}>
            <PlusIcon size={16} color={colors.textSec} />
            <Text variant="caption" tone="secondary" style={{ fontWeight: '600' }}>
              Añadir parte
            </Text>
          </Pressable>
        ) : (
          <View style={styles.addForm}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Nombre (p. ej. Antebrazo)"
              placeholderTextColor={colors.textMut}
              style={styles.formInput}
              maxLength={40}
            />
            <FieldError message={errors.name} />
            <Text variant="eyebrow" tone="muted">Icono</Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {ICON_CHOICES.map((em) => (
                <Pressable
                  key={em}
                  onPress={() => setNewIcon(em)}
                  style={[
                    styles.iconChoice,
                    {
                      backgroundColor: em === newIcon ? colors.text : colors.raised,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>{em}</Text>
                </Pressable>
              ))}
            </View>
            <Text variant="eyebrow" tone="muted" style={{ marginTop: 8 }}>
              Unidad
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {UNIT_CHOICES.map((u) => (
                <Pressable
                  key={u}
                  onPress={() => setNewUnit(u)}
                  style={[
                    styles.unitChoice,
                    { backgroundColor: u === newUnit ? colors.text : colors.raised },
                  ]}
                >
                  <Text
                    variant="caption"
                    style={{ color: u === newUnit ? colors.bg : colors.text, fontWeight: '600' }}
                  >
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Button label="Cancelar" variant="ghost" size="lg" onPress={() => setAdding(false)} flexed />
              <Button label="Añadir" size="lg" onPress={add} flexed />
            </View>
          </View>
        )}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  tabDashed: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: space.xl,
    paddingTop: 20,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigNum: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1.7,
    lineHeight: 58,
  },
  unit: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textSec,
  },
  changePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderRadius: radii.pill,
  },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  logBigNum: {
    fontSize: 64,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -2,
    lineHeight: 66,
  },
  cfgIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.4)',
  },
  addBtn: {
    marginTop: 14,
    height: 48,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  addForm: {
    marginTop: 14,
    padding: 14,
    backgroundColor: colors.elevated,
    borderRadius: 14,
    gap: 12,
  },
  formInput: {
    height: 44,
    backgroundColor: colors.raised,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 14,
  },
  iconChoice: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitChoice: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
