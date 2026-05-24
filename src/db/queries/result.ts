/**
 * Contrato uniforme para mutaciones: { ok: true } | { ok: false, errors }.
 * Convención del proyecto: TODAS las mutations (create/update/delete) deben
 * cumplirlo, así los callers pueden hacer siempre `if (!r.ok) { setError(...); return; }`
 * sin tener que distinguir formas.
 */
export type MutationResult = { ok: true } | { ok: false; errors: Record<string, string> };

const FK_HINTS = ['foreign key', 'foreign-key', 'foreign'];

/**
 * Ejecuta una mutation y traduce excepciones SQLite a MutationResult.
 * Detecta violaciones FK y devuelve un mensaje legible en castellano.
 *
 * Uso típico:
 *   return runMutation(() => db.delete(routines).where(eq(routines.id, id)));
 */
export async function runMutation(fn: () => Promise<unknown>): Promise<MutationResult> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const lower = msg.toLowerCase();
    if (FK_HINTS.some((h) => lower.includes(h))) {
      return { ok: false, errors: { _form: 'No se puede borrar: hay registros relacionados.' } };
    }
    return { ok: false, errors: { _form: msg } };
  }
}
