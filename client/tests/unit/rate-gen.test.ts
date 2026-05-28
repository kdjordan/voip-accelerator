import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRateGenStore } from '@/stores/rate-gen-store';
import {
  currentProviderName,
  RateGenService,
  INCOMPLETE_RATE_REASON,
} from '@/services/rate-gen.service';
import type {
  ProviderInfo,
  RateGenColumnMapping,
  RateGenRecord,
} from '@/types/domains/rate-gen-types';

const provider = (over: Partial<ProviderInfo> = {}): ProviderInfo => ({
  id: 'provider1',
  name: 'Provider 1',
  fileName: 'sinch.csv',
  rowCount: 100,
  invalidRowCount: 0,
  uploadDate: new Date(),
  avgInterRate: 0.01,
  avgIntraRate: 0.01,
  avgIndeterminateRate: 0.01,
  npaCount: 250,
  ...over,
});

describe('rate-gen store — renameProvider', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('updates the display name in place', () => {
    const store = useRateGenStore();
    store.addProvider(provider());

    store.renameProvider('provider1', 'Sinch');

    expect(store.getProviderById('provider1')?.name).toBe('Sinch');
  });

  it('trims and ignores blank names', () => {
    const store = useRateGenStore();
    store.addProvider(provider({ name: 'Sinch' }));

    store.renameProvider('provider1', '  BTS Wholesale  ');
    expect(store.getProviderById('provider1')?.name).toBe('BTS Wholesale');

    store.renameProvider('provider1', '   ');
    expect(store.getProviderById('provider1')?.name).toBe('BTS Wholesale'); // unchanged
  });

  it('is a no-op for an unknown provider id', () => {
    const store = useRateGenStore();
    expect(() => store.renameProvider('ghost', 'X')).not.toThrow();
  });
});

describe('rate-gen upload validation — transformRow rejects incomplete rows', () => {
  beforeEach(() => setActivePinia(createPinia()));

  // NPANXX at index 0, interstate at 1, intrastate at 2 (no indeterminate column mapped)
  const mapping: RateGenColumnMapping = { npanxx: 0, rateInter: 1, rateIntra: 2 };

  const run = (row: string[], over: Partial<RateGenColumnMapping> = {}) => {
    const service = new RateGenService();
    return (service as any).transformRow(
      row,
      { ...mapping, ...over },
      'provider1',
      'Provider 1',
      'sinch.csv'
    ) as RateGenRecord | string;
  };

  it('keeps a row where both rates are positive', () => {
    const result = run(['201555', '0.01', '0.02']);
    expect(typeof result).not.toBe('string');
    const record = result as RateGenRecord;
    expect(record.prefix).toBe('201555');
    expect(record.rateInter).toBe(0.01);
    expect(record.rateIntra).toBe(0.02);
  });

  it('derives indeterminate from interstate when no indeterminate column is mapped', () => {
    const record = run(['201555', '0.03', '0.05']) as RateGenRecord;
    expect(record.rateIndeterminate).toBe(0.03); // == interstate
  });

  it('rejects when interstate is positive but intrastate is zero', () => {
    expect(run(['201555', '0.01', '0'])).toBe(INCOMPLETE_RATE_REASON);
  });

  it('rejects when intrastate is positive but interstate is zero', () => {
    expect(run(['201555', '0', '0.02'])).toBe(INCOMPLETE_RATE_REASON);
  });

  it('rejects when interstate is negative', () => {
    expect(run(['201555', '-0.01', '0.02'])).toBe(INCOMPLETE_RATE_REASON);
  });

  it('rejects when intrastate is negative', () => {
    expect(run(['201555', '0.01', '-0.02'])).toBe(INCOMPLETE_RATE_REASON);
  });

  it('rejects when both rates are zero (existing behavior preserved)', () => {
    expect(run(['201555', '0', '0'])).toBe(INCOMPLETE_RATE_REASON);
  });
});

describe('currentProviderName — rename resolves at generate-time', () => {
  it('prefers the current store name over the name baked into the record', () => {
    const namesById = new Map([['provider1', 'Sinch (renamed)']]);
    const record = { providerId: 'provider1', providerName: 'Provider 1' };

    expect(currentProviderName(record, namesById)).toBe('Sinch (renamed)');
  });

  it('falls back to the record name when the provider is no longer in the store', () => {
    const namesById = new Map<string, string>();
    const record = { providerId: 'provider9', providerName: 'Legacy Co' };

    expect(currentProviderName(record, namesById)).toBe('Legacy Co');
  });
});
