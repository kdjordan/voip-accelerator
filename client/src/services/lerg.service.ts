import Dexie, { Table } from 'dexie';
import type { LERGRecord, StateNPAMapping, CountryLergData } from '@/types/domains/lerg-types';
import { useLergStore } from '@/stores/lerg-store';
import { DBName } from '@/types/app-types';
import useDexieDB from '@/composables/useDexieDB';

export class LergService {
  private store = useLergStore();
  private db: Dexie | null = null;

  constructor() {
    console.log('Initializing LERG service');
    // Don't automatically call initializeDB in constructor
    // This avoids potential race conditions
  }

  async initializeDB() {
    if (!this.db) {
      const { getDB } = useDexieDB();
      this.db = await getDB(DBName.LERG);
      
      // Don't automatically open the database here
      // We'll open it when needed in specific methods
    }
    return this.db;
  }

  async initializeLergTable(lergData: LERGRecord[]): Promise<void> {
    try {
      // Get DB but don't auto-open it
      const db = await this.initializeDB();
      if (!db) throw new Error('Failed to initialize database');

      // Close any existing connection first
      if (db.isOpen()) {
        console.log('Closing existing LERG database before schema modification');
        await db.close();
      }

      // Check if the schema already exists and initialize if needed
      const hasLergTable = db.tables.some((t: Table) => t.name === 'lerg');
      if (!hasLergTable) {
        console.log('Creating new schema for LERG database');
        // Create a new version with the lerg table
        const newVersion = (db.verno || 0) + 1;
        db.version(newVersion).stores({
          lerg: '++id, npa, *state, *country',
        });
      }

      // Now open the database with the correct schema
      await db.open();
      console.log('LERG database opened with schema version:', db.verno);

      // Clear and populate the table
      console.log(`Clearing LERG table before inserting ${lergData.length} records`);
      await db.table('lerg').clear();
      console.log('LERG table cleared successfully');
      
      // Insert the data in smaller batches to avoid transaction limits
      const BATCH_SIZE = 1000;
      for (let i = 0; i < lergData.length; i += BATCH_SIZE) {
        const batch = lergData.slice(i, i + BATCH_SIZE);
        await db.table('lerg').bulkPut(batch);
        console.log(`Added batch ${i / BATCH_SIZE + 1} of LERG data: ${batch.length} records`);
      }
      
      console.log('LERG data initialization completed successfully');
    } catch (error) {
      console.error('Failed to initialize LERG data:', error);
      throw error;
    }
  }

  async getLergData(): Promise<LERGRecord[]> {
    const db = await this.initializeDB();
    if (!db.isOpen()) {
      await db.open();
    }
    return await db.table('lerg').toArray();
  }

  async clearLergData(): Promise<void> {
    try {
      // Get DB reference
      const db = await this.initializeDB();
      
      // Make sure the database is open
      if (!db.isOpen()) {
        await db.open();
      }
      
      // Clear IndexedDB table if it exists
      if (db.tables.some(t => t.name === 'lerg')) {
        console.log('Clearing LERG data from IndexedDB');
        await db.table('lerg').clear();
        console.log('IndexedDB LERG data cleared');
      } else {
        console.log('No LERG table found in IndexedDB to clear');
      }

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
      console.log('LERG store cleared');
    } catch (error) {
      console.error('Failed to clear LERG data:', error);
      throw error;
    }
  }

  async processLergData(): Promise<{
    stateMapping: StateNPAMapping;
    countryData: CountryLergData[];
  }> {
    const db = await this.initializeDB();
    
    // Ensure database is open
    if (!db.isOpen()) {
      await db.open();
    }
    
    // Check if lerg table exists
    if (!db.tables.some(t => t.name === 'lerg')) {
      console.log('No LERG table found, returning empty data');
      return {
        stateMapping: {},
        countryData: [],
      };
    }
    
    const records = await db.table('lerg').toArray();
    console.log(`Processing ${records.length} LERG records from IndexedDB`);

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
