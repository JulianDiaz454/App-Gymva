import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckIcon, ChevronIcon, CloseIcon } from '@/components/AppIcons';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { FieldError } from '@/components/FieldError';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { createExercise } from '@/db/queries/exercises';
import {
  colors,
  COLOR_CHOICES,
  EQUIPMENT,
  ICON_CHOICES,
  MUSCLE_GROUPS,
  radii,
  space,
} from '@/theme/tokens';

export default function CreateExerciseScreen() {
  const { initialName } = useLocalSearchParams<{ initialName?: string }>();
  const [name, setName] = useState<string>(initialName ?? '');
  const [icon, setIcon] = useState<string>('💪');
  const [color, setColor] = useState<string>(COLOR_CHOICES[8]!);
  const [muscle, setMuscle] = useState<string>(MUSCLE_GROUPS[0]!);
  const [equip, setEquip] = useState<string>(EQUIPMENT[0]!);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => name.trim().length > 0 && !saving, [name, saving]);

  const onSave = async () => {
    if (!canSave) return;
    Keyboard.dismiss();
    setSaving(true);
    setErrors({});
    const result = await createExercise({
      name: name.trim(),
      icon,
      color,
      muscleGroup: muscle,
      equipment: equip,
      notes: '',
    });
    setSaving(false);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <IconButton onPress={() => router.back()}>
          <CloseIcon size={18} color={colors.text} />
        </IconButton>
        <Text variant="bodyStrong">Nuevo ejercicio</Text>
        <Pressable
          onPress={onSave}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.saveButton,
            { opacity: canSave ? (pressed ? 0.6 : 1) : 0.4 },
          ]}
        >
          <Text variant="bodyStrong" tone={canSave ? 'primary' : 'muted'} style={{ fontWeight: '700' }}>
            Guardar
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: space.xl, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Preview */}
        <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 28 }}>
          <View style={[styles.preview, { backgroundColor: color, shadowColor: color }]}>
            <ExerciseIcon icon={icon} color={color} size="lg" />
          </View>
        </View>

        {/* Name */}
        <Section label="Nombre">
          <TextInput
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (errors.name) setErrors((e) => ({ ...e, name: '' }));
            }}
            placeholder="p. ej. Press inclinado mancuerna"
            placeholderTextColor={colors.textMut}
            style={styles.input}
            maxLength={60}
          />
          <FieldError message={errors.name} />
        </Section>

        {/* Category */}
        <Section label="Categoría">
          <View style={{ gap: 8 }}>
            <SelectRow label="Grupo muscular" value={muscle} options={[...MUSCLE_GROUPS]} onChange={setMuscle} />
            <SelectRow label="Equipamiento" value={equip} options={[...EQUIPMENT]} onChange={setEquip} />
          </View>
        </Section>

        {/* Icon picker */}
        <Section label="Icono" hint="Elige uno que reconozcas de un vistazo">
          <View style={styles.iconGrid}>
            {ICON_CHOICES.map((em) => {
              const active = icon === em;
              return (
                <Pressable
                  key={em}
                  onPress={() => setIcon(em)}
                  style={[
                    styles.iconCell,
                    {
                      backgroundColor: active ? `${color}33` : 'transparent',
                      borderColor: active ? color : colors.border,
                      borderWidth: active ? 2 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{em}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Color picker */}
        <Section
          label="Color de acento"
          hint="Este es el único color que verás de este ejercicio en la app"
        >
          <View style={styles.colorGrid}>
            {COLOR_CHOICES.map((c) => {
              const active = color === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.colorCell,
                    {
                      backgroundColor: c,
                      borderWidth: active ? 3 : 0,
                      borderColor: colors.bg,
                    },
                  ]}
                >
                  {active ? <CheckIcon size={14} color={colors.bg} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Hint */}
        <View style={styles.hintCard}>
          <View style={styles.hintIcon}>
            <Text style={{ fontSize: 14 }}>💡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="caption" style={{ fontWeight: '600', marginBottom: 2 }}>
              Codifica tu rutina por color
            </Text>
            <Text variant="micro" tone="secondary">
              Asigna un color por grupo muscular o por intensidad para reconocer cada ejercicio en la
              lista de hoy de un vistazo.
            </Text>
          </View>
        </View>

        {errors._form ? (
          <Text variant="caption" tone="bad" style={{ marginTop: 16, textAlign: 'center' }}>
            {errors._form}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text variant="section" tone="muted" style={{ marginBottom: 8 }}>
        {label}
      </Text>
      {children}
      {hint ? (
        <Text variant="micro" tone="muted" style={{ marginTop: 8 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.selectRow}>
        <Text variant="caption" tone="muted">
          {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text variant="bodyStrong">{value}</Text>
          <ChevronIcon size={12} color={colors.textMut} dir={open ? 'up' : 'down'} />
        </View>
      </Pressable>
      {open ? (
        <View style={styles.selectOptions}>
          {options.map((o) => (
            <Pressable
              key={o}
              onPress={() => {
                onChange(o);
                setOpen(false);
              }}
              style={[
                styles.selectOption,
                o === value && { backgroundColor: colors.raised },
              ]}
            >
              <Text variant="caption">{o}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  saveButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  preview: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 32,
    elevation: 12,
  },
  input: {
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  iconGrid: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  iconCell: {
    // flexBasis 18% deja margen para el gap; aspectRatio mantiene cuadrado.
    flexGrow: 0,
    flexBasis: '18%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorGrid: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  colorCell: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintCard: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  hintIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingHorizontal: 16,
  },
  selectOptions: {
    marginTop: 6,
    padding: 6,
    backgroundColor: colors.elevated,
    borderRadius: radii.sm,
    borderColor: colors.border,
    borderWidth: 1,
    gap: 2,
  },
  selectOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
