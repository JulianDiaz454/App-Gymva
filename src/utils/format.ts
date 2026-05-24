/**
 * Formato numérico — es-CO obligatorio (ESPECIFICACION §7.2).
 * Punto = miles, coma = decimales.
 * Toda visualización de números pasa por aquí.
 */

const baseFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 2,
});

export function formatNumber(value: number | null | undefined, opts?: {
  decimals?: number;
  forceDecimals?: boolean;
}): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const decimals = opts?.decimals;
  if (decimals != null) {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: opts?.forceDecimals ? decimals : 0,
      maximumFractionDigits: decimals,
    }).format(value);
  }
  return baseFormatter.format(value);
}

/**
 * Parser de input que entiende coma O punto como separador decimal.
 * Devuelve null si la entrada no es válida.
 */
export function parseDecimalInput(raw: string): number | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.replace(/\s/g, '').replace(',', '.');
  if (cleaned === '') return null;
  // Solo dígitos y un único punto decimal opcional.
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Formatea un buffer de input numérico para mostrarlo con coma decimal. */
export function displayInputBuffer(buf: string): string {
  if (!buf) return '0';
  return buf.replace('.', ',');
}
