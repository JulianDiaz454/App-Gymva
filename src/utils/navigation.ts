import { router } from 'expo-router';

/**
 * Cierra la pantalla actual de forma segura. Si el navigator no puede ir
 * atrás (la pantalla fue replace-eada o se entró por deep link), navega
 * al tab inicial en vez de quedarse atrapado.
 *
 * Usar SIEMPRE en lugar de router.back() directo. router.back() en un
 * stack sin historial deja al usuario sin salida.
 */
export function goBackSafe(): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}
