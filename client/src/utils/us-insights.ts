import type { USPricingComparisonRecord } from '@/types/domains/us-types';

/**
 * Summary metrics powering the US "Insights" dashboard tab.
 * Computed once from the in-memory comparison records (matched NPANXX only)
 * right after the comparison is generated — see USService.processComparisons.
 *
 * Headline KPIs / opportunities / distribution key off the INTERSTATE rate
 * (the Inter vs Intra margin deltas are broken out separately on the cards).
 */
export interface NpaOpportunity {
  npa: string;
  state: string; // state/province code, or country code as fallback
  matchedCodes: number;
  avgRateA: number; // file1 interstate avg over the NPA's matched codes
  avgRateB: number; // file2 interstate avg
  avgMargin: number; // |avgRateA - avgRateB|
  marginPct: number; // avgMargin / max(avgRateA, avgRateB) * 100
}

export interface DistributionBucket {
  label: string;
  sell: number; // codes where file1 is cheaper (you can sell into them)
  buy: number; // codes where file2 is cheaper (you'd buy from them)
}

export interface UsInsightsSummary {
  // Coverage
  matchedCodes: number; // comparable NPANXX (file1 ∩ file2)
  totalFile1Codes: number; // unique NPANXX in file1
  coverageMatchPct: number; // matchedCodes / totalFile1Codes * 100

  // Margin deltas over matched codes (File A − File B)
  avgFile1Inter: number;
  avgFile2Inter: number;
  marginDeltaInter: number;
  avgFile1Intra: number;
  avgFile2Intra: number;
  marginDeltaIntra: number;

  // Opportunities (interstate, code-level)
  sellToCount: number; // file1 cheaper on inter
  buyFromCount: number; // file2 cheaper on inter
  totalOpportunities: number;

  // Match distribution by margin (|B − A| / A), split by direction
  distribution: DistributionBucket[];

  // Top opportunities aggregated by NPA (top 5 by matched-code count)
  topSell: NpaOpportunity[];
  topBuy: NpaOpportunity[];
}

const BUCKET_LABELS = [
  '<10%',
  '10-20%',
  '20-30%',
  '30-40%',
  '40-50%',
  '50-60%',
  '60-70%',
  '70-80%',
  '80-90%',
  '90-100%',
  '>100%',
];

function bucketIndex(marginPct: number): number {
  if (marginPct >= 100) return 10;
  const idx = Math.floor(marginPct / 10);
  return idx < 0 ? 0 : idx > 9 ? 9 : idx;
}

interface NpaAccum {
  npa: string;
  state: string;
  count: number;
  sumA: number; // file1 inter
  sumB: number; // file2 inter
}

/**
 * Aggregate matched comparison records into the Insights summary.
 *
 * @param records matched comparison rows (one per shared NPANXX)
 * @param totalFile1Codes unique NPANXX count in file A (coverage denominator)
 */
export function buildUsInsightsSummary(
  records: USPricingComparisonRecord[],
  totalFile1Codes: number
): UsInsightsSummary {
  const matchedCodes = records.length;

  let sumF1Inter = 0;
  let sumF2Inter = 0;
  let sumF1Intra = 0;
  let sumF2Intra = 0;

  let sellToCount = 0;
  let buyFromCount = 0;

  const distribution: DistributionBucket[] = BUCKET_LABELS.map((label) => ({
    label,
    sell: 0,
    buy: 0,
  }));

  const npaMap = new Map<string, NpaAccum>();

  for (const r of records) {
    const f1 = r.file1_inter ?? 0;
    const f2 = r.file2_inter ?? 0;

    sumF1Inter += f1;
    sumF2Inter += f2;
    sumF1Intra += r.file1_intra ?? 0;
    sumF2Intra += r.file2_intra ?? 0;

    // Opportunity counts (interstate)
    if (r.cheaper_inter === 'file1') sellToCount++;
    else if (r.cheaper_inter === 'file2') buyFromCount++;

    // Distribution: margin = |B − A| / A  (per the mockup footnote), keyed by direction
    if (r.cheaper_inter !== 'same' && f1 > 0) {
      const marginPct = (Math.abs(f2 - f1) / f1) * 100;
      const bucket = distribution[bucketIndex(marginPct)];
      if (r.cheaper_inter === 'file1') bucket.sell++;
      else bucket.buy++;
    }

    // Per-NPA accumulation (interstate)
    let acc = npaMap.get(r.npa);
    if (!acc) {
      acc = { npa: r.npa, state: r.stateCode || r.countryCode || '—', count: 0, sumA: 0, sumB: 0 };
      npaMap.set(r.npa, acc);
    }
    acc.count++;
    acc.sumA += f1;
    acc.sumB += f2;
  }

  // Build NPA opportunities, classify by net direction (avgA vs avgB)
  const sell: NpaOpportunity[] = [];
  const buy: NpaOpportunity[] = [];

  for (const acc of npaMap.values()) {
    const avgRateA = acc.count > 0 ? acc.sumA / acc.count : 0;
    const avgRateB = acc.count > 0 ? acc.sumB / acc.count : 0;
    if (avgRateA === avgRateB) continue; // no net opportunity

    const avgMargin = Math.abs(avgRateA - avgRateB);
    const higher = Math.max(avgRateA, avgRateB);
    const marginPct = higher > 0 ? (avgMargin / higher) * 100 : 0;

    const opp: NpaOpportunity = {
      npa: acc.npa,
      state: acc.state,
      matchedCodes: acc.count,
      avgRateA,
      avgRateB,
      avgMargin,
      marginPct,
    };

    if (avgRateA < avgRateB) sell.push(opp);
    else buy.push(opp);
  }

  const byMatchedDesc = (a: NpaOpportunity, b: NpaOpportunity) => b.matchedCodes - a.matchedCodes;

  const avgF1Inter = matchedCodes > 0 ? sumF1Inter / matchedCodes : 0;
  const avgF2Inter = matchedCodes > 0 ? sumF2Inter / matchedCodes : 0;
  const avgF1Intra = matchedCodes > 0 ? sumF1Intra / matchedCodes : 0;
  const avgF2Intra = matchedCodes > 0 ? sumF2Intra / matchedCodes : 0;

  return {
    matchedCodes,
    totalFile1Codes,
    coverageMatchPct: totalFile1Codes > 0 ? (matchedCodes / totalFile1Codes) * 100 : 0,

    avgFile1Inter: avgF1Inter,
    avgFile2Inter: avgF2Inter,
    marginDeltaInter: avgF1Inter - avgF2Inter,
    avgFile1Intra: avgF1Intra,
    avgFile2Intra: avgF2Intra,
    marginDeltaIntra: avgF1Intra - avgF2Intra,

    sellToCount,
    buyFromCount,
    totalOpportunities: sellToCount + buyFromCount,

    distribution,

    topSell: sell.sort(byMatchedDesc).slice(0, 5),
    topBuy: buy.sort(byMatchedDesc).slice(0, 5),
  };
}
