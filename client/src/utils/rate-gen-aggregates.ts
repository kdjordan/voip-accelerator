// Pure aggregate functions over lean generated records (Rate Composition Studio).
// All scenario-dependent figures (win rate, providers-used, avg rates) are derived
// from the lean records; single-sourced count needs the provider-data map because
// it is a scenario-INDEPENDENT property of the uploaded decks, not the selection.

import type {
  LeanGeneratedRecord,
  RateGenRecord,
  ProviderWinStat,
  WinRateByType,
  RateGenAnalytics,
} from '@/types/domains/rate-gen-types';

/**
 * Split a provider-attribution field into its contributors. In `position` mode
 * this is a single name; in `average` mode it is the joined set ("Alpha, Bravo"),
 * so each contributor is counted separately (participation — shares can sum >100%).
 */
function contributors(field: string): string[] {
  return field.split(', ');
}

/** Count participation for one rate type and turn it into sorted win-stat rows. */
function countWins(records: LeanGeneratedRecord[], pick: (r: LeanGeneratedRecord) => string): ProviderWinStat[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    for (const provider of contributors(pick(r))) {
      counts.set(provider, (counts.get(provider) ?? 0) + 1);
    }
  }
  const total = records.length;
  return Array.from(counts.entries())
    .map(([provider, count]) => ({
      provider,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count || a.provider.localeCompare(b.provider));
}

/**
 * Win rate by rate type: per-provider counts + % of priced prefixes won,
 * separately for interstate / intrastate / indeterminate. Primary studio signal.
 */
export function winRateByType(records: LeanGeneratedRecord[]): WinRateByType {
  return {
    interstate: countWins(records, (r) => r.interProvider),
    intrastate: countWins(records, (r) => r.intraProvider),
    indeterminate: countWins(records, (r) => r.indetProvider),
  };
}

/**
 * Number of prefixes only ONE selected provider quotes (the coverage signal).
 * Needs the provider-data map — this is a property of the uploaded decks, not
 * of the LCR selection.
 */
export function singleSourcedCount(
  prefixes: Iterable<string>,
  dataByPrefix: Map<string, RateGenRecord[]>,
  providerIds: string[]
): number {
  const allowed = new Set(providerIds);
  let count = 0;
  for (const prefix of prefixes) {
    const records = dataByPrefix.get(prefix);
    if (!records) continue;
    const quoting = new Set<string>();
    for (const r of records) {
      if (allowed.has(r.providerId)) quoting.add(r.providerId);
    }
    if (quoting.size === 1) count++;
  }
  return count;
}

/** Distinct providers that contribute to at least one selection across any rate type. */
export function providersUsed(records: LeanGeneratedRecord[]): string[] {
  const used = new Set<string>();
  for (const r of records) {
    for (const p of contributors(r.interProvider)) used.add(p);
    for (const p of contributors(r.intraProvider)) used.add(p);
    for (const p of contributors(r.indetProvider)) used.add(p);
  }
  return Array.from(used);
}

function mean(records: LeanGeneratedRecord[], pick: (r: LeanGeneratedRecord) => number): number {
  if (records.length === 0) return 0;
  let sum = 0;
  for (const r of records) sum += pick(r);
  return sum / records.length;
}

/** Post-markup mean interstate rate. */
export function avgInterstate(records: LeanGeneratedRecord[]): number {
  return mean(records, (r) => r.rate);
}

/** Post-markup mean intrastate rate. */
export function avgIntrastate(records: LeanGeneratedRecord[]): number {
  return mean(records, (r) => r.intrastate);
}

/** Post-markup mean indeterminate rate. */
export function avgIndeterminate(records: LeanGeneratedRecord[]): number {
  return mean(records, (r) => r.indeterminate);
}

/** Bundle every aggregate into the RateGenAnalytics shape. */
export function computeAnalytics(
  records: LeanGeneratedRecord[],
  prefixes: Iterable<string>,
  dataByPrefix: Map<string, RateGenRecord[]>,
  providerIds: string[]
): RateGenAnalytics {
  return {
    totalPrefixes: records.length,
    winRateByType: winRateByType(records),
    singleSourcedCount: singleSourcedCount(prefixes, dataByPrefix, providerIds),
    providersUsed: providersUsed(records),
    avgInterstate: avgInterstate(records),
    avgIntrastate: avgIntrastate(records),
    avgIndeterminate: avgIndeterminate(records),
  };
}
