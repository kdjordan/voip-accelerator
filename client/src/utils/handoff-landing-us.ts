// Landing-side mapper for a rate deck hand-off into the US Adjuster (Pricing Studio).
// Turns the portable, source-agnostic hand-off rows into USRateSheetEntry[] exactly as a
// successful CSV upload would — deriving stateCode from the LERG NPA lookup ('N/A' on miss)
// and leaving effectiveDate to the store's default. See docs/adr/0009-cross-module-rate-deck-handoff.md.

import type { RateDeckHandoffRow } from '@/types/domains/handoff-types';
import type { USRateSheetEntry } from '@/types/domains/us-types';

// LERG lookup: NPA -> state/province code, or undefined when the NPA isn't known.
export type LergNpaLookup = (npa: string) => string | undefined;

/**
 * Maps hand-off rows to USRateSheetEntry rows, mirroring the upload path's post-parse shape:
 * - stateCode = lookup(npa) || 'N/A' (same fallback as USRateSheetService.processRow)
 * - no id (Dexie auto-increments the primary key)
 * - no effectiveDate (the store applies its default on handleUploadSuccess)
 */
export function mapHandoffRowsToEntries(
  rows: RateDeckHandoffRow[],
  lookup: LergNpaLookup
): USRateSheetEntry[] {
  return rows.map((row) => ({
    npa: row.npa,
    nxx: row.nxx,
    npanxx: row.npanxx,
    stateCode: lookup(row.npa) || 'N/A',
    interRate: row.interRate,
    intraRate: row.intraRate,
    indetermRate: row.indetermRate,
  }));
}
