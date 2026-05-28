import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import {
  normalizeNpanxx,
  splitNpaNxx,
  buildHandoffFromGenerated,
  buildHandoffFromRateSheet,
} from '@/utils/deck-handoff';
import { useHandoffStore } from '@/stores/handoff-store';
import type { LeanGeneratedRecord } from '@/types/domains/rate-gen-types';
import type { USRateSheetEntry } from '@/types/domains/us-types';
import type { RateDeckHandoff } from '@/types/domains/handoff-types';

function generatedRecord(prefix: string): LeanGeneratedRecord {
  return {
    prefix,
    rate: 0.0123,
    intrastate: 0.0211,
    indeterminate: 0.0188,
    interProvider: 'ProviderA',
    intraProvider: 'ProviderB',
    indetProvider: 'ProviderA',
    appliedMarkup: 0.1,
  };
}

function rateSheetEntry(npanxx: string): USRateSheetEntry {
  return {
    id: 7,
    npa: npanxx.slice(0, 3),
    nxx: npanxx.slice(3, 6),
    npanxx,
    stateCode: 'NJ',
    interRate: 0.0099,
    intraRate: 0.0155,
    indetermRate: 0.0133,
    effectiveDate: '2026-06-01',
  };
}

describe('normalizeNpanxx', () => {
  it('strips a single leading "1" from a 7-digit value', () => {
    expect(normalizeNpanxx('1201200')).toBe('201200');
  });

  it('leaves an already-6-digit value unchanged', () => {
    expect(normalizeNpanxx('201200')).toBe('201200');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeNpanxx('  1201200  ')).toBe('201200');
    expect(normalizeNpanxx(' 201200 ')).toBe('201200');
  });
});

describe('splitNpaNxx', () => {
  it('splits into npa (first 3) and nxx (last 3)', () => {
    expect(splitNpaNxx('201200')).toEqual({ npa: '201', nxx: '200' });
  });
});

describe('buildHandoffFromGenerated', () => {
  it('remaps fields, normalizes + splits npanxx, and sets metadata', () => {
    const records = [generatedRecord('1201200'), generatedRecord('212500')];
    const handoff = buildHandoffFromGenerated(records, {
      name: 'LCR2 · Position',
      target: 'adjuster',
    });

    expect(handoff.rows).toHaveLength(2);
    expect(handoff.rows[0]).toEqual({
      npanxx: '201200',
      npa: '201',
      nxx: '200',
      interRate: 0.0123, // rate -> interRate
      intraRate: 0.0211, // intrastate -> intraRate
      indetermRate: 0.0188, // indeterminate -> indetermRate
    });

    expect(handoff.name).toBe('LCR2 · Position');
    expect(handoff.source).toBe('composition-studio');
    expect(handoff.target).toBe('adjuster');
    expect(handoff.provenance).toBe('Composition Studio · LCR2 · Position · 2 prefixes');
  });

  it('honors an analyzer target', () => {
    const handoff = buildHandoffFromGenerated([generatedRecord('201200')], {
      name: 'LCR1',
      target: 'analyzer',
    });
    expect(handoff.target).toBe('analyzer');
  });
});

describe('buildHandoffFromRateSheet', () => {
  it('maps directly, drops stateCode/effectiveDate, and sets metadata', () => {
    const entries = [rateSheetEntry('201200'), rateSheetEntry('212500')];
    const handoff = buildHandoffFromRateSheet(entries, {
      name: 'Worked Sheet',
      target: 'analyzer',
    });

    expect(handoff.rows).toHaveLength(2);
    expect(handoff.rows[0]).toEqual({
      npanxx: '201200',
      npa: '201',
      nxx: '200',
      interRate: 0.0099,
      intraRate: 0.0155,
      indetermRate: 0.0133,
    });
    // stateCode / effectiveDate are not carried.
    expect(handoff.rows[0]).not.toHaveProperty('stateCode');
    expect(handoff.rows[0]).not.toHaveProperty('effectiveDate');

    expect(handoff.source).toBe('adjuster');
    expect(handoff.target).toBe('analyzer');
    expect(handoff.provenance).toBe('Adjuster · Worked Sheet · 2 prefixes');
  });
});

describe('handoff-store (carrier)', () => {
  beforeEach(() => setActivePinia(createPinia()));

  const sample: RateDeckHandoff = {
    rows: [{ npanxx: '201200', npa: '201', nxx: '200', interRate: 0.01, intraRate: 0.02, indetermRate: 0.015 }],
    name: 'LCR2 · Position',
    source: 'composition-studio',
    target: 'adjuster',
    provenance: 'Composition Studio · LCR2 · Position · 1 prefixes',
  };

  it('setPending makes hasPending true', () => {
    const store = useHandoffStore();
    expect(store.hasPending).toBe(false);
    store.setPending(sample);
    expect(store.hasPending).toBe(true);
    expect(store.pending).toEqual(sample);
  });

  it('consume returns the pending hand-off then clears it (one-shot)', () => {
    const store = useHandoffStore();
    store.setPending(sample);

    const first = store.consume();
    expect(first).toEqual(sample);
    expect(store.hasPending).toBe(false);

    const second = store.consume();
    expect(second).toBeNull();
  });

  it('clear() empties a pending hand-off', () => {
    const store = useHandoffStore();
    store.setPending(sample);
    store.clear();
    expect(store.hasPending).toBe(false);
    expect(store.pending).toBeNull();
  });
});
