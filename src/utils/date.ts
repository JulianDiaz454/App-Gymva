const MONTHS_ABBR_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_FULL_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DOW_LONG_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DOW_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** ISO YYYY-MM-DD para una Date. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function parseIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** "20 may" */
export function formatShortDate(iso: string): string {
  const d = parseIso(iso);
  return `${d.getDate()} ${MONTHS_ABBR_ES[d.getMonth()]}`;
}

/** "miércoles, 20 may" */
export function formatLongDate(iso: string): string {
  const d = parseIso(iso);
  return `${DOW_LONG_ES[d.getDay()]}, ${d.getDate()} ${MONTHS_ABBR_ES[d.getMonth()]}`;
}

/** Devuelve el ISO YYYY-MM-DD del lunes de la semana de `d`. */
export function weekStartIso(d: Date): string {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (copy.getDay() + 6) % 7; // 0=lunes
  copy.setDate(copy.getDate() - dow);
  return toIsoDate(copy);
}

/** Día de semana ISO (0=lunes ... 6=domingo) */
export function isoDayOfWeek(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export { MONTHS_ABBR_ES, MONTHS_FULL_ES, DOW_LONG_ES, DOW_SHORT_ES };
