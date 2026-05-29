// Derived export-format default (ADR-0010).
//
// The export toggle's default is inferred from the uploaded source format(s):
// all-XLSX → 'xlsx', all-CSV → 'csv', mixed or empty/unknown → 'csv'. Always
// overridable by the user via the FormatToggle.

import type { TabularFormat } from '@/utils/tabular-io';

/**
 * PURE: pick the default export format from the tracked source formats.
 * - all 'xlsx'        → 'xlsx'
 * - all 'csv'         → 'csv'
 * - mixed / empty     → 'csv'
 */
export function defaultExportFormat(formats: TabularFormat[]): TabularFormat {
  if (formats.length > 0 && formats.every((f) => f === 'xlsx')) return 'xlsx';
  return 'csv';
}
