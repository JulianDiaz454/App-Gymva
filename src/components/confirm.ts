/**
 * Confirmación para acciones destructivas (borrar serie/rutina, archivar).
 * Envuelve Alert nativo en una promesa para usarlo con async/await sin
 * repetir el patrón de callbacks en cada call site (§P5).
 */
import { Alert } from 'react-native';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export function confirm(options: ConfirmOptions): Promise<boolean> {
  const {
    title,
    message,
    confirmLabel = 'Aceptar',
    cancelLabel = 'Cancelar',
    destructive = false,
  } = options;

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
