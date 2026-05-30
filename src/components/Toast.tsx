/**
 * Toast no bloqueante para feedback breve (serie guardada, ejercicio sustituido…).
 * Sin librerías externas (§P5): un host montado en el root + API imperativa
 * `toast.success/info/error(msg)` invocable desde cualquier archivo, incluso
 * fuera de React.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckIcon, CloseIcon } from '@/components/AppIcons';
import { Text } from '@/components/Text';
import { colors, radii, space } from '@/theme/tokens';

type ToastTone = 'success' | 'info' | 'error';

interface ToastPayload {
  id: number;
  message: string;
  tone: ToastTone;
}

type Listener = (payload: ToastPayload) => void;

let listener: Listener | null = null;
let nextId = 1;

function emit(message: string, tone: ToastTone): void {
  if (!message) return;
  listener?.({ id: nextId++, message, tone });
}

export const toast = {
  success: (message: string) => emit(message, 'success'),
  info: (message: string) => emit(message, 'info'),
  error: (message: string) => emit(message, 'error'),
};

const VISIBLE_MS = 2200;

const TONE_META: Record<ToastTone, { bg: string; fg: string; border: string }> = {
  success: { bg: colors.okSubtle, fg: colors.ok, border: 'rgba(74,222,128,0.4)' },
  info: { bg: colors.elevated, fg: colors.text, border: colors.border },
  error: { bg: colors.badSubtle, fg: colors.bad, border: 'rgba(248,113,113,0.4)' },
};

export function ToastHost() {
  const [current, setCurrent] = useState<ToastPayload | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((payload: ToastPayload) => {
    if (timer.current) clearTimeout(timer.current);
    setCurrent(payload);
    timer.current = setTimeout(() => setCurrent(null), VISIBLE_MS);
  }, []);

  useEffect(() => {
    listener = show;
    return () => {
      listener = null;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [show]);

  if (!current) return null;

  const meta = TONE_META[current.tone];

  return (
    <SafeAreaView edges={['top']} style={styles.host} pointerEvents="none">
      <Animated.View
        key={current.id}
        entering={FadeInUp.duration(220)}
        exiting={FadeOutUp.duration(180)}
        style={[styles.toast, { backgroundColor: meta.bg, borderColor: meta.border }]}
      >
        <View style={styles.iconWrap}>
          {current.tone === 'error' ? (
            <CloseIcon size={14} color={meta.fg} />
          ) : (
            <CheckIcon size={14} color={meta.fg} />
          )}
        </View>
        <Text variant="caption" style={{ color: meta.fg, fontWeight: '600', flex: 1 }}>
          {current.message}
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: space.sm,
    maxWidth: '92%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
