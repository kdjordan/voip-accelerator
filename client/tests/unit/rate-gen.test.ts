import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { currentProviderName } from '@/services/rate-gen.service';
import type { ProviderInfo } from '@/types/domains/rate-gen-types';

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
