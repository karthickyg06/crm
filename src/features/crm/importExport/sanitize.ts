/**
 * Spreadsheet formula-injection protection.
 * Prefix dangerous leading characters in string cells so Excel/Sheets
 * treat them as text, not formulas.
 *
 * Phone numbers (+91…) and plain negative numerics are left unchanged.
 */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function sanitizeCell(value: string | number): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return String(value);
  }
  const text = value ?? "";
  if (/^\+\d/.test(text)) return text;
  if (/^-\d+(\.\d+)?$/.test(text)) return text;
  if (FORMULA_PREFIX.test(text)) {
    return `'${text}`;
  }
  return text;
}

export function sanitizeRow(
  row: Record<string, string | number>,
): Record<string, string | number> {
  const next: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(row)) {
    next[key] = sanitizeCell(value);
  }
  return next;
}
