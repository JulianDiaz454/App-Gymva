import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radii } from '@/theme/tokens';

import { FieldError } from './FieldError';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  hint?: string;
  rightAdornment?: string;
}

export function TextField({
  label,
  error,
  hint,
  rightAdornment,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      {label ? (
        <Text variant="section" tone="muted" style={{ marginBottom: 8 }}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.container,
          {
            borderColor: error ? colors.bad : focused ? colors.text : 'transparent',
          },
        ]}
      >
        <TextInput
          {...rest}
          placeholderTextColor={colors.textMut}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={styles.input}
        />
        {rightAdornment ? (
          <Text variant="caption" tone="muted" style={{ marginRight: 14 }}>
            {rightAdornment}
          </Text>
        ) : null}
      </View>
      {hint && !error ? (
        <Text variant="micro" tone="muted" style={{ marginTop: 6 }}>
          {hint}
        </Text>
      ) : null}
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
});
