/**
 * Safely formats a YYYY-MM-DD date string to a locale-specific format.
 * Appends UTC time to avoid timezone shifts during parsing.
 * @param fecha The date string to format.
 * @returns A formatted date string (e.g., "27/10/2025") or '—' if invalid.
 */
export const fmtDate = (fecha?: string): string => {
  if (!fecha) return '—';
  // Force ISO by appending midnight UTC to avoid timezone shifts from YYYY-MM-DD
  const d = new Date(`${fecha}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) {
    return fecha; // Return original string if it's not a valid date
  }
  return d.toLocaleDateString('es-AR', { timeZone: 'UTC' });
};

/**
 * Safely formats a numeric weight value to two decimal places.
 * Handles null, undefined, and string inputs.
 * @param pesaje_kg The weight value.
 * @returns A formatted weight string (e.g., "123.45") or '—' if invalid.
 */
export const fmtKg = (pesaje_kg?: number | string | null): string => {
  const kg = pesaje_kg != null ? Number(pesaje_kg) : null;
  if (kg == null || Number.isNaN(kg)) {
    return '—';
  }
  return kg.toFixed(2);
};
