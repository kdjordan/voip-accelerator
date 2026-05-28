// Slot-selection for landing a rate-deck hand-off into the Analyzer (US comparison).
// The Analyzer has two comparison slots; a landing fills one. Pure — no Pinia/DOM.
// See docs/adr/0009-cross-module-rate-deck-handoff.md.

/** Sentinel meaning "both slots are full — ask the user which to replace". */
export const ASK_WHICH_SLOT = 'ask' as const;

/**
 * Pick the slot a landing hand-off should fill, given the two slot ids and the
 * set of currently-occupied slots:
 *  - both empty  → the first slot
 *  - one empty   → the empty one
 *  - both full   → ASK_WHICH_SLOT (caller prompts the user to choose)
 */
export function pickAnalyzerSlot(
  slots: readonly string[],
  occupied: ReadonlySet<string>
): string {
  const empty = slots.find((slot) => !occupied.has(slot));
  return empty ?? ASK_WHICH_SLOT;
}

/**
 * Turn a hand-off label (e.g. "LCR2 · Position") into a safe, unique `.csv`
 * filename. The Analyzer derives a Dexie table name from the filename
 * (`name.toLowerCase().replace('.csv','')`), so the result must be collision-free
 * against the other slot's filename and contain no path/whitespace oddities.
 */
export function deriveHandoffFileName(name: string, existing: readonly string[]): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'handoff';

  const taken = new Set(existing.map((f) => f.toLowerCase()));
  let candidate = `${slug}.csv`;
  let suffix = 2;
  while (taken.has(candidate)) {
    candidate = `${slug}-${suffix}.csv`;
    suffix += 1;
  }
  return candidate;
}
