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

/**
 * PURE: build the Final Rate Deck CSV string — prefix + the three post-markup
 * rates + effective date, plus the optional geo columns. NPANXX is emitted
 * combined (one column) or split (npa/nxx), with an optional "1" country code.
 */
export function buildFinalDeckCsv(
  records: LeanGeneratedRecord[],
  options: FinalDeckCsvOptions,
  effectiveDate: Date,
  npaLookup: NpaLookup
): string {
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

  const rows = records.map((r) => {
    const row: Record<string, unknown> = {};

    const npa = r.prefix.substring(0, 3);
    const nxx = r.prefix.substring(3, 6);
    if (options.npanxxFormat === 'split') {
      row.npa = options.includeCountryCode ? `1${npa}` : npa;
      row.nxx = nxx;
    } else {
      row.npanxx = options.includeCountryCode ? `1${r.prefix}` : r.prefix;
    }

    row.interstate = r.rate;
    row.intrastate = r.intrastate;
    row.indeterminate = r.indeterminate;
    row.effective_date = dateStr;

    if (needsGeo) {
      const geo = npaLookup(npa);
      if (options.includeStateColumn) row.state = geo?.state ?? '';
      if (options.includeCountryColumn) row.country = geo?.country ?? 'US';
      if (options.includeRegionColumn) row.region = geo?.region ?? '';
    }

    return row;
  });

  return Papa.unparse(rows, { columns: headers, header: true, newline: '\n' });
}

/**
 * PURE: build the Route Distribution CSV string — one row per prefix with the
 * three per-rate-type winner provider names.
 */
export function buildRouteDistributionCsv(records: LeanGeneratedRecord[]): string {
  const rows = records.map((r) => ({
    prefix: r.prefix,
    inter: r.interProvider,
    intra: r.intraProvider,
    indet: r.indetProvider,
  }));

  return Papa.unparse(rows, {
    columns: ['prefix', 'inter', 'intra', 'indet'],
    header: true,
    newline: '\n',
  });
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
