import { describe, it, expect } from 'vitest';
import { buildUsInsightsSummary } from '@/utils/us-insights';
import type { USPricingComparisonRecord } from '@/types/domains/us-types';

// Build a matched comparison record; cheaper_inter is derived from the inter rates
// (intra mirrors inter to keep the record internally consistent).
function rec(npanxx: string, npa: string, f1i: number, f2i: number): USPricingComparisonRecord {
  const cheaper = f1i < f2i ? 'file1' : f1i > f2i ? 'file2' : 'same';
  return {
    npanxx,
    npa,
    nxx: npanxx.slice(3),
    stateCode: 'XX',
    countryCode: 'US',
    file1_inter: f1i,
    file1_intra: f1i,
    file1_indeterm: 0,
    file2_inter: f2i,
    file2_intra: f2i,
    file2_indeterm: 0,
    diff_inter_pct: 0,
    diff_intra_pct: 0,
    diff_indeterm_pct: 0,
    cheaper_inter: cheaper,
    cheaper_intra: cheaper,
    cheaper_indeterm: 'same',
  };
}

describe('buildUsInsightsSummary', () => {
  const records: USPricingComparisonRecord[] = [
    rec('201111', '201', 0.002, 0.006), // sell, margin 200% -> >100%
    rec('201222', '201', 0.002, 0.0025), // sell, margin 25%  -> 20-30%
    rec('305111', '305', 0.006, 0.002), // buy,  margin 66.67% -> 60-70%
    rec('415111', '415', 0.001, 0.001), // same, excluded everywhere
  ];
  const summary = buildUsInsightsSummary(records, 5);

  it('computes coverage against file-A total codes', () => {
    expect(summary.matchedCodes).toBe(4);
    expect(summary.totalFile1Codes).toBe(5);
    expect(summary.coverageMatchPct).toBeCloseTo(80, 5);
  });

  it('counts sell/buy opportunities by interstate cheaper flag (excludes "same")', () => {
    expect(summary.sellToCount).toBe(2);
    expect(summary.buyFromCount).toBe(1);
    expect(summary.totalOpportunities).toBe(3);
  });

  it('computes the File A − File B interstate margin delta over matched codes', () => {
    // avgA = (0.002+0.002+0.006+0.001)/4, avgB = (0.006+0.0025+0.002+0.001)/4
    expect(summary.avgFile1Inter).toBeCloseTo(0.00275, 6);
    expect(summary.avgFile2Inter).toBeCloseTo(0.002875, 6);
    expect(summary.marginDeltaInter).toBeCloseTo(-0.000125, 6);
  });

  it('bins the margin distribution (|B − A| / A) by direction', () => {
    const byLabel = Object.fromEntries(summary.distribution.map((b) => [b.label, b]));
    expect(byLabel['20-30%'].sell).toBe(1);
    expect(byLabel['60-70%'].buy).toBe(1);
    expect(byLabel['>100%'].sell).toBe(1);
    // 'same' record contributes nothing
    expect(summary.distribution.reduce((n, b) => n + b.sell + b.buy, 0)).toBe(3);
  });

  it('aggregates top opportunities by NPA, classified by net direction', () => {
    expect(summary.topSell).toHaveLength(1);
    expect(summary.topSell[0].npa).toBe('201');
    expect(summary.topSell[0].matchedCodes).toBe(2);
    expect(summary.topSell[0].avgRateA).toBeCloseTo(0.002, 6);
    expect(summary.topSell[0].avgRateB).toBeCloseTo(0.00425, 6);
    expect(summary.topSell[0].avgMargin).toBeCloseTo(0.00225, 6);
    expect(summary.topSell[0].marginPct).toBeCloseTo(52.9412, 3);

    expect(summary.topBuy).toHaveLength(1);
    expect(summary.topBuy[0].npa).toBe('305');
    expect(summary.topBuy[0].marginPct).toBeCloseTo(66.6667, 3);
  });

  it('handles an empty record set without dividing by zero', () => {
    const empty = buildUsInsightsSummary([], 0);
    expect(empty.matchedCodes).toBe(0);
    expect(empty.coverageMatchPct).toBe(0);
    expect(empty.totalOpportunities).toBe(0);
    expect(empty.topSell).toEqual([]);
  });
});
