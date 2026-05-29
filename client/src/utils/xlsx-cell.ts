// PURE xlsx cell normalization (ADR-0010). No Vue / DOM / worker / papaparse
// imports — this module is imported by both the main-thread tabular-IO layer
// and the xlsx-parse web worker, so it must stay dependency-free.

/**
 * PURE: normalize one xlsx cell value to the string form papaparse would have
 * produced. xlsx cells arrive typed (number / boolean / Date), so:
 *  - null / undefined → ''
 *  - number → a plain decimal string, NO scientific notation and NO float
 *    precision drift (0.008 stays "0.008"; 213555 stays "213555"; 1e-7 →
 *    "0.0000001", never "1e-7")
 *  - Date → ISO date "YYYY-MM-DD"
 *  - string / boolean / everything else → String(value)
 */
export function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return '';

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return String(value); // NaN / Infinity — leave as-is
    if (Number.isInteger(value)) return String(value);
    // Non-integer: avoid both scientific notation (e.g. "1e-7") and binary
    // float drift (e.g. "0.007999999..."). maximumFractionDigits caps the tail;
    // useGrouping:false drops thousands separators.
    return value.toLocaleString('en-US', {
      useGrouping: false,
      maximumFractionDigits: 20,
    });
  }

  if (value instanceof Date) {
    // ISO date only (no time component). xlsx dates are date-typed cells.
    return value.toISOString().slice(0, 10);
  }

  return String(value);
}
