// Cross-module rate deck hand-off — the portable, source-agnostic snapshot
// pushed Compose → Adjust → Compare. See docs/adr/0009-cross-module-rate-deck-handoff.md.
//
// A hand-off row is intentionally the SAME shape as USStandardizedData (interstate /
// intrastate / indeterminate rates, NPANXX-keyed) plus nothing extra. stateCode and
// effectiveDate are derived/defaulted at LANDING (a later slice), NOT carried here.

export interface RateDeckHandoffRow {
  npanxx: string; // 6-digit, leading "1" stripped
  npa: string; // first 3 of npanxx
  nxx: string; // last 3 of npanxx
  interRate: number;
  intraRate: number;
  indetermRate: number;
}

export type HandoffSource = 'composition-studio' | 'adjuster';
export type HandoffTarget = 'adjuster' | 'analyzer';

export interface RateDeckHandoff {
  rows: RateDeckHandoffRow[];
  name: string; // carried label, e.g. "LCR2 · Position"
  source: HandoffSource;
  target: HandoffTarget;
  provenance: string; // human line, e.g. "Composition Studio · LCR2 · Position · 224,318 prefixes"
}
