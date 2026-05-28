import { describe, it, expect } from 'vitest';
import {
  buildFinalDeckCsv,
  buildRouteDistributionCsv,
  formatEffectiveDate,
  DEFAULT_FINAL_DECK_CSV_OPTIONS,
  type FinalDeckCsvOptions,
  type NpaGeo,
} from '@/utils/rate-gen-deck-csv';
import { buildSummaryLines, buildWinRateTable } from '@/utils/rate-gen-summary-pdf';
import type {
  LeanGeneratedRecord,
  GeneratedRateDeck,
  RateGenAnalytics,
} from '@/types/domains/rate-gen-types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const lean = (
  prefix: string,
  rate: number,
  intrastate: number,
  indeterminate: number,
  interProvider: string,
  intraProvider: string,
  indetProvider: string
): LeanGeneratedRecord => ({
  prefix,
  rate,
  intrastate,
  indeterminate,
  interProvider,
  intraProvider,
  indetProvider,
  appliedMarkup: 0,
});

const records: LeanGeneratedRecord[] = [
  lean('201555', 0.01, 0.02, 0.03, 'Alpha', 'Bravo', 'Charlie'),
  lean('310777', 0.011, 0.022, 0.033, 'Bravo', 'Alpha', 'Alpha'),
];

// 201 → NJ, 310 → CA fixture geo
const geoByNpa: Record<string, NpaGeo> = {
  '201': { state: 'NJ', country: 'US', region: 'Northeast' },
  '310': { state: 'CA', country: 'US', region: 'West' },
};
const npaLookup = (npa: string): NpaGeo | null => geoByNpa[npa] ?? null;

const effectiveDate = new Date(2026, 5, 1); // June 1 2026 (month is 0-indexed)

// ---------------------------------------------------------------------------
// formatEffectiveDate
// ---------------------------------------------------------------------------

describe('formatEffectiveDate', () => {
  it('formats as zero-padded MM/DD/YYYY', () => {
    expect(formatEffectiveDate(new Date(2026, 5, 1))).toBe('06/01/2026');
    expect(formatEffectiveDate(new Date(2026, 11, 25))).toBe('12/25/2026');
  });
});

// ---------------------------------------------------------------------------
// buildFinalDeckCsv
// ---------------------------------------------------------------------------

describe('buildFinalDeckCsv', () => {
  it('default options: combined npanxx, no +1, no geo', () => {
    const csv = buildFinalDeckCsv(records, DEFAULT_FINAL_DECK_CSV_OPTIONS, effectiveDate, npaLookup);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('npanxx,interstate,intrastate,indeterminate,effective_date');
    expect(lines[1]).toBe('201555,0.01,0.02,0.03,06/01/2026');
    expect(lines[2]).toBe('310777,0.011,0.022,0.033,06/01/2026');
    expect(lines).toHaveLength(3);
  });

  it('split format emits npa + nxx columns', () => {
    const opts: FinalDeckCsvOptions = { ...DEFAULT_FINAL_DECK_CSV_OPTIONS, npanxxFormat: 'split' };
    const csv = buildFinalDeckCsv(records, opts, effectiveDate, npaLookup);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('npa,nxx,interstate,intrastate,indeterminate,effective_date');
    expect(lines[1]).toBe('201,555,0.01,0.02,0.03,06/01/2026');
  });

  it('includeCountryCode prepends 1 to combined prefix', () => {
    const opts: FinalDeckCsvOptions = { ...DEFAULT_FINAL_DECK_CSV_OPTIONS, includeCountryCode: true };
    const csv = buildFinalDeckCsv(records, opts, effectiveDate, npaLookup);
    expect(csv.split('\n')[1].startsWith('1201555,')).toBe(true);
  });

  it('includeCountryCode prepends 1 to the npa in split format', () => {
    const opts: FinalDeckCsvOptions = {
      ...DEFAULT_FINAL_DECK_CSV_OPTIONS,
      npanxxFormat: 'split',
      includeCountryCode: true,
    };
    const csv = buildFinalDeckCsv(records, opts, effectiveDate, npaLookup);
    expect(csv.split('\n')[1].startsWith('1201,555,')).toBe(true);
  });

  it('adds geo columns from the npaLookup', () => {
    const opts: FinalDeckCsvOptions = {
      ...DEFAULT_FINAL_DECK_CSV_OPTIONS,
      includeStateColumn: true,
      includeCountryColumn: true,
      includeRegionColumn: true,
    };
    const csv = buildFinalDeckCsv(records, opts, effectiveDate, npaLookup);
    const lines = csv.split('\n');
    expect(lines[0]).toBe(
      'npanxx,interstate,intrastate,indeterminate,effective_date,state,country,region'
    );
    expect(lines[1]).toBe('201555,0.01,0.02,0.03,06/01/2026,NJ,US,Northeast');
    expect(lines[2]).toBe('310777,0.011,0.022,0.033,06/01/2026,CA,US,West');
  });

  it('falls back gracefully when the npa is unknown', () => {
    const opts: FinalDeckCsvOptions = {
      ...DEFAULT_FINAL_DECK_CSV_OPTIONS,
      includeStateColumn: true,
      includeCountryColumn: true,
      includeRegionColumn: true,
    };
    const unknown = [lean('999000', 0.01, 0.02, 0.03, 'Alpha', 'Alpha', 'Alpha')];
    const csv = buildFinalDeckCsv(unknown, opts, effectiveDate, () => null);
    // state '', country defaults to US, region ''
    expect(csv.split('\n')[1]).toBe('999000,0.01,0.02,0.03,06/01/2026,,US,');
  });
});

// ---------------------------------------------------------------------------
// buildRouteDistributionCsv
// ---------------------------------------------------------------------------

describe('buildRouteDistributionCsv', () => {
  it('emits prefix + three per-rate-type winner names', () => {
    const csv = buildRouteDistributionCsv(records);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('prefix,inter,intra,indet');
    expect(lines[1]).toBe('201555,Alpha,Bravo,Charlie');
    expect(lines[2]).toBe('310777,Bravo,Alpha,Alpha');
    expect(lines).toHaveLength(3);
  });

  it('quotes provider names containing commas (Average strategy joins them)', () => {
    const joined = [lean('201555', 0.02, 0.03, 0.04, 'Alpha, Bravo', 'Alpha, Bravo', 'Alpha, Bravo')];
    const csv = buildRouteDistributionCsv(joined);
    // Papa quotes the comma-containing field
    expect(csv.split('\n')[1]).toBe('201555,"Alpha, Bravo","Alpha, Bravo","Alpha, Bravo"');
  });

  it('returns an empty string for an empty deck', () => {
    // Papa.unparse over no rows yields no output; downloads are gated on records.
    const csv = buildRouteDistributionCsv([]);
    expect(csv).toBe('');
  });
});

// ---------------------------------------------------------------------------
// PDF data-shaping (pure)
// ---------------------------------------------------------------------------

const deck: GeneratedRateDeck = {
  id: 'rate-deck-1',
  name: 'My LCR1 Deck',
  lcrStrategy: 'LCR1',
  markupPercentage: 15,
  providerIds: ['A', 'B'],
  generatedDate: new Date(2026, 5, 1),
  effectiveDate: new Date(2026, 5, 8),
  rowCount: 2,
};

const analytics: RateGenAnalytics = {
  totalPrefixes: 2,
  singleSourcedCount: 1,
  providersUsed: ['Alpha', 'Bravo'],
  avgInterstate: 0.0105,
  avgIntrastate: 0.021,
  avgIndeterminate: 0.0315,
  winRateByType: {
    interstate: [
      { provider: 'Alpha', count: 1, percentage: 50 },
      { provider: 'Bravo', count: 1, percentage: 50 },
    ],
    intrastate: [
      { provider: 'Alpha', count: 1, percentage: 50 },
      { provider: 'Bravo', count: 1, percentage: 50 },
    ],
    indeterminate: [
      { provider: 'Charlie', count: 1, percentage: 50 },
      { provider: 'Alpha', count: 1, percentage: 50 },
    ],
  },
};

describe('buildSummaryLines', () => {
  it('produces labelled summary lines', () => {
    const lines = buildSummaryLines(deck, analytics);
    expect(lines).toContain('Deck name: My LCR1 Deck');
    expect(lines).toContain('LCR strategy: LCR1');
    expect(lines).toContain('Markup: 15%');
    expect(lines).toContain('Total prefixes: 2');
    expect(lines).toContain('Single-sourced: 1');
    expect(lines).toContain('Providers used: Alpha, Bravo');
    expect(lines).toContain('Avg interstate: 0.010500');
    expect(lines).toContain('Avg intrastate: 0.021000');
    expect(lines).toContain('Avg indeterminate: 0.031500');
  });

  it('renders a fixed markup label when markupFixed is set', () => {
    const fixedDeck = { ...deck, markupPercentage: 0, markupFixed: 0.002 };
    expect(buildSummaryLines(fixedDeck, analytics)).toContain('Markup: $0.002 fixed');
  });

  it('handles a missing effective date', () => {
    const noDate = { ...deck, effectiveDate: undefined };
    expect(buildSummaryLines(noDate, analytics)).toContain('Effective date: N/A');
  });

  it('shows None when no providers were used', () => {
    const empty = { ...analytics, providersUsed: [] };
    expect(buildSummaryLines(deck, empty)).toContain('Providers used: None');
  });
});

describe('buildWinRateTable', () => {
  it('flattens win-rate-by-type into rate type / provider / wins / share rows', () => {
    const { headers, rows } = buildWinRateTable(analytics);
    expect(headers).toEqual(['Rate type', 'Provider', 'Wins', 'Share']);
    // first row of each section carries the label; subsequent rows blank it
    expect(rows[0]).toEqual(['Interstate', 'Alpha', '1', '50.0%']);
    expect(rows[1]).toEqual(['', 'Bravo', '1', '50.0%']);
    expect(rows[2]).toEqual(['Intrastate', 'Alpha', '1', '50.0%']);
    expect(rows[4]).toEqual(['Indeterminate', 'Charlie', '1', '50.0%']);
  });

  it('emits a None row for a rate type with no winners', () => {
    const empty: RateGenAnalytics = {
      ...analytics,
      winRateByType: { interstate: [], intrastate: [], indeterminate: [] },
    };
    const { rows } = buildWinRateTable(empty);
    expect(rows).toEqual([
      ['Interstate', 'None', '0', '0%'],
      ['Intrastate', 'None', '0', '0%'],
      ['Indeterminate', 'None', '0', '0%'],
    ]);
  });
});
