// Pure CSV builders for the Generated Decks tab (Rate Composition Studio).
//
// All data-shaping here is pure so it can be unit-tested without IndexedDB, the
// LERG store, or the DOM. The Vue component supplies an `npaLookup` closure
// (backed by the LERG store) and triggers the browser download.

import Papa from 'papaparse';
import type { LeanGeneratedRecord } from '@/types/domains/rate-gen-types';

/** Geo info for one NPA — the subset of the LERG record the CSV columns need. */
export interface NpaGeo {
  state?: string; // state/province code (e.g. "NJ")
  country?: string; // country code (e.g. "US")
  region?: string | null; // geographic region
}

/** Lookup an NPA's geo info; returns null when unknown. Supplied by the caller. */
export type NpaLookup = (npa: string) => NpaGeo | null;

/** Format options for the Final Rate Deck CSV (carried forward from the old wizard). */
export interface FinalDeckCsvOptions {
  npanxxFormat: 'combined' | 'split'; // 213555 vs 213 | 555
  includeCountryCode: boolean; // prepend "1" to the prefix
  includeStateColumn: boolean;
  includeCountryColumn: boolean;
  includeRegionColumn: boolean;
}

export const DEFAULT_FINAL_DECK_CSV_OPTIONS: FinalDeckCsvOptions = {
  npanxxFormat: 'combined',
  includeCountryCode: false,
  includeStateColumn: false,
  includeCountryColumn: false,
  includeRegionColumn: false,
};

/** Format an effective date as MM/DD/YYYY (the legacy CSV convention). */
export function formatEffectiveDate(date: Date): string {
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  return `${mm}/${dd}/${date.getFullYear()}`;
}

/** Headers + positional rows for a tabular export (format-agnostic — ADR-0010). */
export interface TabularData {
  headers: string[];
  rows: (string | number)[][];
}

/**
 * PURE: build the Final Rate Deck as { headers, rows } — prefix + the three
 * post-markup rates + effective date, plus the optional geo columns. NPANXX is
 * emitted combined (one column) or split (npa/nxx), with an optional "1" country
 * code. Format-agnostic so the component can route it through the tabular-IO
 * layer for CSV or XLSX (ADR-0010).
 */
export function buildFinalDeckRows(
  records: LeanGeneratedRecord[],
  options: FinalDeckCsvOptions,
  effectiveDate: Date,
  npaLookup: NpaLookup
): TabularData {
  const needsGeo =
    options.includeStateColumn || options.includeCountryColumn || options.includeRegionColumn;

  const headers: string[] = [];
  if (options.npanxxFormat === 'split') {
    headers.push('npa', 'nxx');
  } else {
    headers.push('npanxx');
  }
  headers.push('interstate', 'intrastate', 'indeterminate', 'effective_date');
  if (options.includeStateColumn) headers.push('state');
  if (options.includeCountryColumn) headers.push('country');
  if (options.includeRegionColumn) headers.push('region');

  const dateStr = formatEffectiveDate(effectiveDate);

  const rows: (string | number)[][] = records.map((r) => {
    const row: (string | number)[] = [];

    const npa = r.prefix.substring(0, 3);
    const nxx = r.prefix.substring(3, 6);
    if (options.npanxxFormat === 'split') {
      row.push(options.includeCountryCode ? `1${npa}` : npa, nxx);
    } else {
      row.push(options.includeCountryCode ? `1${r.prefix}` : r.prefix);
    }

    row.push(r.rate, r.intrastate, r.indeterminate, dateStr);

    if (needsGeo) {
      const geo = npaLookup(npa);
      if (options.includeStateColumn) row.push(geo?.state ?? '');
      if (options.includeCountryColumn) row.push(geo?.country ?? 'US');
      if (options.includeRegionColumn) row.push(geo?.region ?? '');
    }

    return row;
  });

  return { headers, rows };
}

/**
 * PURE: build the Final Rate Deck CSV string. Thin wrapper over
 * buildFinalDeckRows for CSV-only callers (and the unit tests).
 */
export function buildFinalDeckCsv(
  records: LeanGeneratedRecord[],
  options: FinalDeckCsvOptions,
  effectiveDate: Date,
  npaLookup: NpaLookup
): string {
  const { headers, rows } = buildFinalDeckRows(records, options, effectiveDate, npaLookup);
  return Papa.unparse([headers, ...rows], { header: false, newline: '\n' });
}

/**
 * PURE: build the Route Distribution as { headers, rows } — one row per prefix
 * with the three per-rate-type winner provider names. Format-agnostic.
 */
export function buildRouteDistributionRows(records: LeanGeneratedRecord[]): TabularData {
  return {
    headers: ['prefix', 'inter', 'intra', 'indet'],
    rows: records.map((r) => [r.prefix, r.interProvider, r.intraProvider, r.indetProvider]),
  };
}

/**
 * PURE: build the Route Distribution CSV string. Thin wrapper over
 * buildRouteDistributionRows for CSV-only callers (and the unit tests).
 */
export function buildRouteDistributionCsv(records: LeanGeneratedRecord[]): string {
  const { headers, rows } = buildRouteDistributionRows(records);
  // Empty deck → no output (preserves the prior Papa.unparse-over-objects
  // behavior and matches the download gate in the component).
  if (rows.length === 0) return '';
  return Papa.unparse([headers, ...rows], { header: false, newline: '\n' });
}

/** Trigger a browser download of a CSV string. */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
