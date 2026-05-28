import { describe, it, expect } from 'vitest';
import {
  selectLeanRecords,
  selectByStrategy,
  applyMarkup,
} from '@/services/rate-gen.service';
import {
  winRateByType,
  singleSourcedCount,
  providersUsed,
  avgInterstate,
  avgIntrastate,
  avgIndeterminate,
  computeAnalytics,
} from '@/utils/rate-gen-aggregates';
import type { RateGenRecord, LCRConfig, LeanGeneratedRecord } from '@/types/domains/rate-gen-types';

// ---------------------------------------------------------------------------
// Deterministic fixtures: 3 providers, hand-chosen rates across a few prefixes.
// ---------------------------------------------------------------------------

const rec = (
  prefix: string,
  providerId: string,
  providerName: string,
  rateInter: number,
  rateIntra: number,
  rateIndeterminate: number
): RateGenRecord => ({
  prefix,
  providerId,
  providerName,
  fileName: `${providerName}.csv`,
  rateInter,
  rateIntra,
  rateIndeterminate,
  uploadDate: new Date('2026-01-01'),
});

// Three providers (A, B, C) with deliberately different orderings per rate type.
//
// prefix 100000 — all three quote:
//   inter: A 0.01 < B 0.02 < C 0.03            → LCR1 A, LCR2 B, LCR3 C
//   intra: C 0.04 < A 0.05 < B 0.06            → LCR1 C, LCR2 A, LCR3 B
//   indet: B 0.07 < C 0.08 < A 0.09            → LCR1 B, LCR2 C, LCR3 A
// prefix 200000 — A and B quote (single-source for C absent):
//   inter: B 0.011 < A 0.012                   → LCR1 B, LCR2 A
//   intra: A 0.013 < B 0.014                   → LCR1 A, LCR2 B
//   indet: A 0.015 < B 0.016                   → LCR1 A, LCR2 B
// prefix 300000 — only C quotes (single-sourced):
//   inter/intra/indet: C wins everything
const data: RateGenRecord[] = [
  rec('100000', 'A', 'Alpha', 0.01, 0.05, 0.09),
  rec('100000', 'B', 'Bravo', 0.02, 0.06, 0.07),
  rec('100000', 'C', 'Charlie', 0.03, 0.04, 0.08),

  rec('200000', 'A', 'Alpha', 0.012, 0.013, 0.015),
  rec('200000', 'B', 'Bravo', 0.011, 0.014, 0.016),

  rec('300000', 'C', 'Charlie', 0.1, 0.2, 0.3),
];

function buildMap(records: RateGenRecord[]): Map<string, RateGenRecord[]> {
  const map = new Map<string, RateGenRecord[]>();
  for (const r of records) {
    if (!map.has(r.prefix)) map.set(r.prefix, []);
    map.get(r.prefix)!.push(r);
  }
  return map;
}

const dataByPrefix = buildMap(data);
const allPrefixes = ['100000', '200000', '300000'];
const allProviderIds = ['A', 'B', 'C'];

const config = (over: Partial<LCRConfig> = {}): LCRConfig => ({
  strategy: 'LCR1',
  markupPercentage: 0,
  providerIds: allProviderIds,
  ...over,
});

// ---------------------------------------------------------------------------
// selectByStrategy — pure LCR pick
// ---------------------------------------------------------------------------

describe('selectByStrategy', () => {
  const rates = [
    { rate: 0.03, provider: 'Charlie' },
    { rate: 0.01, provider: 'Alpha' },
    { rate: 0.02, provider: 'Bravo' },
  ];

  it('LCR1 picks the cheapest', () => {
    expect(selectByStrategy(rates, 'LCR1')).toEqual({ rate: 0.01, provider: 'Alpha' });
  });

  it('LCR2 picks the second cheapest', () => {
    expect(selectByStrategy(rates, 'LCR2')).toEqual({ rate: 0.02, provider: 'Bravo' });
  });

  it('LCR3 picks the third cheapest', () => {
    expect(selectByStrategy(rates, 'LCR3')).toEqual({ rate: 0.03, provider: 'Charlie' });
  });

  it('LCRn falls back to the deepest available when fewer providers', () => {
    const two = [
      { rate: 0.02, provider: 'Bravo' },
      { rate: 0.01, provider: 'Alpha' },
    ];
    // LCR3 with only two rates falls back to the second (deepest available).
    expect(selectByStrategy(two, 'LCR3')).toEqual({ rate: 0.02, provider: 'Bravo' });
  });

  it('Average returns the mean rate and joined provider list', () => {
    const result = selectByStrategy(rates, 'Average');
    expect(result.rate).toBeCloseTo((0.01 + 0.02 + 0.03) / 3, 10);
    expect(result.provider).toBe('Alpha, Bravo, Charlie');
  });

  it('ignores zero/negative rates', () => {
    const withZeros = [
      { rate: 0, provider: 'Zero' },
      { rate: 0.05, provider: 'Real' },
    ];
    expect(selectByStrategy(withZeros, 'LCR1')).toEqual({ rate: 0.05, provider: 'Real' });
  });

  it('returns the None sentinel when no positive rates exist', () => {
    expect(selectByStrategy([{ rate: 0, provider: 'X' }], 'LCR1')).toEqual({
      rate: 0,
      provider: 'None',
    });
  });
});

// ---------------------------------------------------------------------------
// applyMarkup — percentage and fixed
// ---------------------------------------------------------------------------

describe('applyMarkup', () => {
  it('applies a percentage markup', () => {
    expect(applyMarkup(0.1, config({ markupPercentage: 20 }))).toBeCloseTo(0.12, 10);
  });

  it('applies a fixed markup (additive)', () => {
    expect(applyMarkup(0.1, config({ markupPercentage: 0, markupFixed: 0.005 }))).toBeCloseTo(
      0.105,
      10
    );
  });

  it('fixed markup takes precedence over percentage when > 0', () => {
    expect(
      applyMarkup(0.1, config({ markupPercentage: 50, markupFixed: 0.01 }))
    ).toBeCloseTo(0.11, 10);
  });

  it('rounds to 6 decimal places', () => {
    // 0.0333333... * 1.0 → rounded to 6dp
    expect(applyMarkup(1 / 30, config({ markupPercentage: 0 }))).toBe(0.033333);
  });

  it('zero markup is a no-op (still rounded)', () => {
    expect(applyMarkup(0.025, config({ markupPercentage: 0 }))).toBe(0.025);
  });
});

// ---------------------------------------------------------------------------
// selectLeanRecords — full per-prefix selection over a prefix set
// ---------------------------------------------------------------------------

describe('selectLeanRecords', () => {
  it('selects LCR1 winners per rate type, independently', () => {
    const records = selectLeanRecords(allPrefixes, dataByPrefix, config({ strategy: 'LCR1' }));
    const p1 = records.find((r) => r.prefix === '100000')!;

    expect(p1.interProvider).toBe('Alpha'); // inter cheapest
    expect(p1.intraProvider).toBe('Charlie'); // intra cheapest
    expect(p1.indetProvider).toBe('Bravo'); // indet cheapest
    expect(p1.rate).toBeCloseTo(0.01, 10);
    expect(p1.intrastate).toBeCloseTo(0.04, 10);
    expect(p1.indeterminate).toBeCloseTo(0.07, 10);
  });

  it('selects LCR2 winners per rate type', () => {
    const records = selectLeanRecords(allPrefixes, dataByPrefix, config({ strategy: 'LCR2' }));
    const p1 = records.find((r) => r.prefix === '100000')!;

    expect(p1.interProvider).toBe('Bravo'); // 2nd cheapest inter
    expect(p1.intraProvider).toBe('Alpha'); // 2nd cheapest intra
    expect(p1.indetProvider).toBe('Charlie'); // 2nd cheapest indet
  });

  it('selects LCR3 winners per rate type', () => {
    const records = selectLeanRecords(allPrefixes, dataByPrefix, config({ strategy: 'LCR3' }));
    const p1 = records.find((r) => r.prefix === '100000')!;

    expect(p1.interProvider).toBe('Charlie'); // 3rd cheapest inter
    expect(p1.intraProvider).toBe('Bravo'); // 3rd cheapest intra
    expect(p1.indetProvider).toBe('Alpha'); // 3rd cheapest indet
  });

  it('Average strategy averages and joins providers', () => {
    const records = selectLeanRecords(allPrefixes, dataByPrefix, config({ strategy: 'Average' }));
    const p1 = records.find((r) => r.prefix === '100000')!;

    expect(p1.rate).toBeCloseTo((0.01 + 0.02 + 0.03) / 3, 10);
    expect(p1.interProvider).toBe('Alpha, Bravo, Charlie');
  });

  it('applies percentage markup to all three final rates', () => {
    const records = selectLeanRecords(
      allPrefixes,
      dataByPrefix,
      config({ strategy: 'LCR1', markupPercentage: 10 })
    );
    const p1 = records.find((r) => r.prefix === '100000')!;

    expect(p1.rate).toBeCloseTo(0.011, 10);
    expect(p1.intrastate).toBeCloseTo(0.044, 10);
    expect(p1.indeterminate).toBeCloseTo(0.077, 10);
    expect(p1.appliedMarkup).toBe(10);
  });

  it('applies fixed markup and records it', () => {
    const records = selectLeanRecords(
      allPrefixes,
      dataByPrefix,
      config({ strategy: 'LCR1', markupPercentage: 0, markupFixed: 0.001 })
    );
    const p1 = records.find((r) => r.prefix === '100000')!;

    expect(p1.rate).toBeCloseTo(0.011, 10);
    expect(p1.appliedMarkup).toBe(0.001);
  });

  it('works on any subset of prefixes', () => {
    const records = selectLeanRecords(['200000'], dataByPrefix, config({ strategy: 'LCR1' }));
    expect(records).toHaveLength(1);
    expect(records[0].prefix).toBe('200000');
    expect(records[0].interProvider).toBe('Bravo'); // 0.011 < 0.012
  });

  it('skips prefixes no selected provider quotes', () => {
    const records = selectLeanRecords(
      ['999999', '100000'],
      dataByPrefix,
      config({ strategy: 'LCR1' })
    );
    expect(records.map((r) => r.prefix)).toEqual(['100000']);
  });

  it('honors the providerIds filter', () => {
    // Only provider C — prefix 100000 falls back to C across all types.
    const records = selectLeanRecords(
      allPrefixes,
      dataByPrefix,
      config({ strategy: 'LCR1', providerIds: ['C'] })
    );
    const p1 = records.find((r) => r.prefix === '100000')!;
    expect(p1.interProvider).toBe('Charlie');
    // prefix 200000 has no C → excluded
    expect(records.find((r) => r.prefix === '200000')).toBeUndefined();
  });

  it('resolves current provider names via namesById', () => {
    const namesById = new Map([['A', 'Alpha (renamed)']]);
    const records = selectLeanRecords(
      ['100000'],
      dataByPrefix,
      config({ strategy: 'LCR1' }),
      namesById
    );
    expect(records[0].interProvider).toBe('Alpha (renamed)');
  });
});

// ---------------------------------------------------------------------------
// Aggregates
// ---------------------------------------------------------------------------

describe('aggregates over lean records', () => {
  // LCR1 lean records over the full fixture set.
  const lean: LeanGeneratedRecord[] = selectLeanRecords(
    allPrefixes,
    dataByPrefix,
    config({ strategy: 'LCR1' })
  );
  // Expected LCR1 winners:
  // 100000 → inter Alpha, intra Charlie, indet Bravo
  // 200000 → inter Bravo, intra Alpha,   indet Alpha
  // 300000 → inter Charlie, intra Charlie, indet Charlie

  it('winRateByType counts winners per provider per rate type', () => {
    const w = winRateByType(lean);

    const inter = Object.fromEntries(w.interstate.map((s) => [s.provider, s.count]));
    expect(inter).toEqual({ Alpha: 1, Bravo: 1, Charlie: 1 });

    const intra = Object.fromEntries(w.intrastate.map((s) => [s.provider, s.count]));
    expect(intra).toEqual({ Charlie: 2, Alpha: 1 });

    const indet = Object.fromEntries(w.indeterminate.map((s) => [s.provider, s.count]));
    expect(indet).toEqual({ Bravo: 1, Alpha: 1, Charlie: 1 });
  });

  it('winRateByType percentages sum to ~100 per rate type', () => {
    const w = winRateByType(lean);
    const sum = (arr: { percentage: number }[]) =>
      arr.reduce((acc, s) => acc + s.percentage, 0);

    expect(sum(w.interstate)).toBeCloseTo(100, 6);
    expect(sum(w.intrastate)).toBeCloseTo(100, 6);
    expect(sum(w.indeterminate)).toBeCloseTo(100, 6);

    // Charlie wins 2/3 intrastate
    const charlieIntra = w.intrastate.find((s) => s.provider === 'Charlie')!;
    expect(charlieIntra.percentage).toBeCloseTo((2 / 3) * 100, 6);
  });

  it('singleSourcedCount counts prefixes only one selected provider quotes', () => {
    // 100000 → 3 providers, 200000 → 2 providers, 300000 → 1 provider
    expect(singleSourcedCount(allPrefixes, dataByPrefix, allProviderIds)).toBe(1);
  });

  it('singleSourcedCount respects the providerIds filter', () => {
    // Restricting to {A, B}: 100000 has A+B (2), 200000 has A+B (2), 300000 has none.
    expect(singleSourcedCount(allPrefixes, dataByPrefix, ['A', 'B'])).toBe(0);
    // Restricting to {A}: every prefix that A quotes is single-sourced.
    // A quotes 100000 and 200000 → both single-sourced.
    expect(singleSourcedCount(allPrefixes, dataByPrefix, ['A'])).toBe(2);
  });

  it('providersUsed lists distinct winners across all rate types', () => {
    const used = providersUsed(lean);
    expect(used.sort()).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('avg* compute post-markup means', () => {
    // inter winners: 0.01, 0.011, 0.1 → mean
    expect(avgInterstate(lean)).toBeCloseTo((0.01 + 0.011 + 0.1) / 3, 10);
    // intra winners: 0.04, 0.013, 0.2
    expect(avgIntrastate(lean)).toBeCloseTo((0.04 + 0.013 + 0.2) / 3, 10);
    // indet winners: 0.07, 0.015, 0.3
    expect(avgIndeterminate(lean)).toBeCloseTo((0.07 + 0.015 + 0.3) / 3, 10);
  });

  it('avg* return 0 on empty input', () => {
    expect(avgInterstate([])).toBe(0);
    expect(avgIntrastate([])).toBe(0);
    expect(avgIndeterminate([])).toBe(0);
  });

  it('computeAnalytics bundles every aggregate', () => {
    const analytics = computeAnalytics(lean, allPrefixes, dataByPrefix, allProviderIds);

    expect(analytics.totalPrefixes).toBe(3);
    expect(analytics.singleSourcedCount).toBe(1);
    expect(analytics.providersUsed.sort()).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(analytics.avgInterstate).toBeCloseTo((0.01 + 0.011 + 0.1) / 3, 10);
    expect(analytics.winRateByType.interstate).toHaveLength(3);
  });
});
