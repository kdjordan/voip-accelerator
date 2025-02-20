import Dexie from 'dexie';
import type { LERGRecord, StateNPAMapping, CountryLergData } from '@/types/lerg-types';
import { useLergStore } from '@/stores/lerg-store';
import { DBConfig, createDatabase } from '@/config/database';

export class LergService {
  private store = useLergStore();
  private db: Dexie;

  constructor() {
    console.log('Initializing LERG service with database:', DBConfig.LERG.name);
    this.db = createDatabase(DBConfig.LERG);
  }

  // Private implementation
  private async handleProcessingSuccess(data: LERGRecord[]) {
    console.log('Processing completed successfully');
    await this.db.table('lerg').bulkPut(data);

    // Process the data and update the store
    const { stateMapping, countryData } = await this.processLergData();

    this.store.isLocallyStored = true;
    this.store.setLergStats(data.length);
    this.store.setStateNPAs(stateMapping);
    this.store.countryData = countryData;

    const count = await this.db.table('lerg').count();
    console.log('Count of LERG records:', count);
  }

  private handleProcessingError(error: string | Error) {
    const errorMessage = error instanceof Error ? error.message : error;
    this.store.isProcessing = false;
    this.store.setError(errorMessage);
    this.store.setLergStats(0);
    this.store.setStateNPAs({}); // Reset state mappings on error
  }

  async initializeLergTable(lergData: LERGRecord[]): Promise<void> {
    try {
      console.log('Initializing LERG table with records:', lergData?.length);
      await this.db.table('lerg').clear();
      await this.db.table('lerg').bulkPut(lergData);
      console.log('Data initialization completed successfully');
    } catch (error: unknown) {
      console.error('Failed to initialize data:', error);
      throw error;
    }
  }

  async getLergData(): Promise<LERGRecord[]> {
    return await this.db.table('lerg').toArray();
  }

  async clearLergData(): Promise<void> {
    try {
      // Clear IndexDB
      await this.db.table('lerg').clear();
      console.log('IndexDB LERG data cleared');

      // Clear store
      const store = useLergStore();
      store.$patch({
        isProcessing: false,
        isLocallyStored: false,
        stateNPAs: {},
        countryData: [],
        stats: {
          totalRecords: 0,
          lastUpdated: null,
        },
      });
    } catch (error) {
      console.error('Failed to clear LERG data:', error);
      throw error;
    }
  }

  async processLergData(): Promise<{
    stateMapping: StateNPAMapping;
    countryData: CountryLergData[];
  }> {
    const records = await this.db.table('lerg').toArray();
    console.log('Records from IndexedDB:', records);

    // Process state mappings
    const stateMapping: StateNPAMapping = {};
    const canadaProvinces: Record<string, Set<string>> = {};
    const countryMap = new Map<string, Set<string>>();

    // First pass - identify all US records including California
    const usRecords = records.filter(
      record => record.country === 'US' || (record.state === 'CA' && record.country === 'US')
    );

    // Second pass - identify true Canadian records
    const canadianRecords = records.filter(
      record => record.country === 'CA' && !(record.state === 'CA' && record.country === 'US')
    );

    // Third pass - other countries
    const otherRecords = records.filter(record => record.country !== 'US' && record.country !== 'CA');

    // Process US records
    for (const record of usRecords) {
      if (!stateMapping[record.state]) {
        stateMapping[record.state] = [];
      }
      if (!stateMapping[record.state].includes(record.npa)) {
        stateMapping[record.state].push(record.npa);
      }

      if (!countryMap.has('US')) {
        countryMap.set('US', new Set());
      }
      countryMap.get('US')!.add(record.npa);
    }

    // Process Canadian records
    for (const record of canadianRecords) {
      if (!canadaProvinces[record.state]) {
        canadaProvinces[record.state] = new Set();
      }
      canadaProvinces[record.state].add(record.npa);

      if (!countryMap.has('CA')) {
        countryMap.set('CA', new Set());
      }
      countryMap.get('CA')!.add(record.npa);
    }

    // Process other countries
    for (const record of otherRecords) {
      if (!countryMap.has(record.country)) {
        countryMap.set(record.country, new Set());
      }
      countryMap.get(record.country)!.add(record.npa);
    }

    // Convert country map to CountryLergData array
    const countryData: CountryLergData[] = Array.from(countryMap.entries()).map(([country, npas]) => ({
      country,
      npaCount: npas.size,
      npas: Array.from(npas).sort(),
      // Add provinces for Canada
      provinces:
        country === 'CA'
          ? Object.entries(canadaProvinces).map(([code, npas]) => ({
              code,
              npas: Array.from(npas).sort(),
            }))
          : undefined,
    }));

    return {
      stateMapping,
      countryData: countryData.sort((a, b) => b.npaCount - a.npaCount),
    };
  }
}
