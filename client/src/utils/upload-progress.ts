/**
 * Single source of truth for how a real chunked write reports progress.
 *
 * Every upload pipeline that streams data to IndexedDB in chunks (US Analyzer,
 * US Adjuster, Rate Composition Studio) maps its write phase through this one
 * function, so the curves are identical by construction — not "tuned to match"
 * (which decays the next time someone edits one service in isolation).
 *
 * Each surface still owns its OWN band: the write is one phase of a larger flow
 * (e.g. the Studio precedes it with a 0→50 transform and follows it with a
 * 100→110 metadata band), so only the math of mapping (stored / total) onto a
 * [from, to] band is shared — not a single signature forced on every pipeline.
 *
 * Pure: no store/DOM dependencies.
 *
 * @param stored  rows written so far
 * @param total   total rows to write
 * @param band    the progress band this write phase occupies, e.g. { from: 0, to: 99 }
 * @returns a progress value within [band.from, band.to]
 */
export function reportWriteProgress(
  stored: number,
  total: number,
  band: { from: number; to: number }
): number {
  if (total <= 0) return band.from;
  const fraction = Math.min(1, Math.max(0, stored / total));
  return band.from + fraction * (band.to - band.from);
}
