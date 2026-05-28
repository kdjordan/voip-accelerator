import { describe, it, expect } from 'vitest';
import { mapHandoffRowsToEntries } from '@/utils/handoff-landing-us';
import type { RateDeckHandoffRow } from '@/types/domains/handoff-types';

function row(npanxx: string): RateDeckHandoffRow {
  return {
    npanxx,
    npa: npanxx.slice(0, 3),
    nxx: npanxx.slice(3, 6),
    interRate: 0.0123,
    intraRate: 0.0211,
    indetermRate: 0.0188,
  };
}

describe('mapHandoffRowsToEntries', () => {
  it('derives stateCode from the LERG lookup', () => {
    const lookup = (npa: string) => (npa === '201' ? 'NJ' : undefined);
    const [entry] = mapHandoffRowsToEntries([row('201555')], lookup);
    expect(entry.stateCode).toBe('NJ');
  });

  it("falls back to 'N/A' when the NPA is not found", () => {
    const [entry] = mapHandoffRowsToEntries([row('999555')], () => undefined);
    expect(entry.stateCode).toBe('N/A');
  });

  it('maps npanxx/npa/nxx and all three rates through unchanged', () => {
    const [entry] = mapHandoffRowsToEntries([row('212867')], () => 'NY');
    expect(entry.npanxx).toBe('212867');
    expect(entry.npa).toBe('212');
    expect(entry.nxx).toBe('867');
    expect(entry.interRate).toBe(0.0123);
    expect(entry.intraRate).toBe(0.0211);
    expect(entry.indetermRate).toBe(0.0188);
  });

  it('does not set id or effectiveDate (left to Dexie / store default)', () => {
    const [entry] = mapHandoffRowsToEntries([row('305555')], () => 'FL');
    expect(entry.id).toBeUndefined();
    expect(entry.effectiveDate).toBeUndefined();
  });

  it('preserves the row count', () => {
    const rows = [row('201555'), row('212867'), row('305555')];
    const entries = mapHandoffRowsToEntries(rows, () => 'XX');
    expect(entries).toHaveLength(3);
  });

  it('returns an empty array for no rows', () => {
    expect(mapHandoffRowsToEntries([], () => 'XX')).toEqual([]);
  });
});
