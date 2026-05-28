// Pure builder utilities for the cross-module rate deck hand-off.
// No Pinia, no LERG, no Dexie, no DOM — just shape transforms.
// See docs/adr/0009-cross-module-rate-deck-handoff.md.

import type { LeanGeneratedRecord } from '@/types/domains/rate-gen-types';
import type { USRateSheetEntry } from '@/types/domains/us-types';
import type {
  RateDeckHandoff,
  RateDeckHandoffRow,
  HandoffTarget,
} from '@/types/domains/handoff-types';

/**
 * Strip a single leading "1" from a 7-digit NPANXX, returning the 6-digit form.
 * Whitespace is trimmed. Already-6-digit input is returned unchanged.
 */
export function normalizeNpanxx(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 7 && trimmed.startsWith('1')) {
    return trimmed.slice(1);
  }
  return trimmed;
}

/** Split a 6-digit NPANXX into its npa (first 3) and nxx (chars 3-6). */
export function splitNpaNxx(npanxx: string): { npa: string; nxx: string } {
  return {
    npa: npanxx.slice(0, 3),
    nxx: npanxx.slice(3, 6),
  };
}

/**
 * Build a hand-off snapshot from generated (Composition Studio) records.
 * `target` is supplied by the caller (the "Send to…" button), not inferred here.
 */
export function buildHandoffFromGenerated(
  records: LeanGeneratedRecord[],
  meta: { name: string; target: HandoffTarget }
): RateDeckHandoff {
  const rows: RateDeckHandoffRow[] = records.map((record) => {
    const npanxx = normalizeNpanxx(record.prefix);
    const { npa, nxx } = splitNpaNxx(npanxx);
    return {
      npanxx,
      npa,
      nxx,
      interRate: record.rate,
      intraRate: record.intrastate,
      indetermRate: record.indeterminate,
    };
  });

  return {
    rows,
    name: meta.name,
    source: 'composition-studio',
    target: meta.target,
    provenance: `Composition Studio · ${meta.name} · ${records.length.toLocaleString()} prefixes`,
  };
}

/**
 * Build a hand-off snapshot from the Adjuster's current rate-sheet entries.
 * Entries already carry npa/nxx/npanxx; stateCode/effectiveDate are dropped.
 * `target` is supplied by the caller (the "Send to…" button).
 */
export function buildHandoffFromRateSheet(
  entries: USRateSheetEntry[],
  meta: { name: string; target: HandoffTarget }
): RateDeckHandoff {
  const rows: RateDeckHandoffRow[] = entries.map((entry) => ({
    npanxx: entry.npanxx,
    npa: entry.npa,
    nxx: entry.nxx,
    interRate: entry.interRate,
    intraRate: entry.intraRate,
    indetermRate: entry.indetermRate,
  }));

  return {
    rows,
    name: meta.name,
    source: 'adjuster',
    target: meta.target,
    provenance: `Adjuster · ${meta.name} · ${entries.length.toLocaleString()} prefixes`,
  };
}
