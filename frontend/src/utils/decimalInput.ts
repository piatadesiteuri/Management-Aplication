/** Parse user input that may use comma or dot as decimal separator. */
export function parseDecimalInput(value: string): number {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!normalized) return 0;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Format a number for display in Romanian-style decimal fields. */
export function formatDecimalInput(value: number, fractionDigits = 2): string {
  if (!Number.isFinite(value) || value === 0) return '';
  return value.toFixed(fractionDigits).replace('.', ',');
}
