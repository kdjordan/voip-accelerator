import Dexie, { Table } from 'dexie';
import type { RateSheetRecord, GroupedRateData, RateStatistics } from '@/types/rate-sheet-types';
import { useRateSheetStore } from '@/stores/rate-sheet-store';
import { DBName } from '@/types/app-types';
import useDexieDB from '@/composables/useDexieDB';
import Papa from 'papaparse';

export class RateSheetService {
  private store = useRateSheetStore();
  private db: Dexie | null = null;

  constructor() {
    console.log('Initializing Rate Sheet service');
    this.initializeDB();
  }

  async initializeDB() {
    if (!this.db) {
      const { getDB } = useDexieDB();
      this.db = await getDB(DBName.RATE_SHEET);
      await this.db.open();
    }
    return this.db;
  }

  async processRateSheetData(data: RateSheetRecord[]): Promise<void> {
    try {
      const db = await this.initializeDB();
      if (!db) throw new Error('Failed to initialize database');

      // Only create new schema if table doesn't exist
      if (!db.tables.some((t: Table) => t.name === 'rate_sheet')) {
        await db.close();
        db.version(db.verno! + 1).stores({
          rate_sheet: '++id, name, prefix, rate, *effective, *minDuration, *increments',
        });
        await db.open();
      }

      await db.table('rate_sheet').clear();
      await db.table('rate_sheet').bulkPut(data);
      console.log('Rate sheet data processed successfully');
    } catch (error) {
      console.error('Failed to process rate sheet data:', error);
      throw error;
    }
  }

  async clearData(): Promise<void> {
    try {
      const db = await this.initializeDB();
      if (!db) throw new Error('Failed to initialize database');
      await db.table('rate_sheet').clear();
      this.store.$reset();
    } catch (error) {
      console.error('Failed to clear rate sheet data:', error);
      throw error;
    }
  }

  async getRateSheetData(): Promise<RateSheetRecord[]> {
    const db = await this.initializeDB();
    if (!db) throw new Error('Failed to initialize database');
    return await db.table('rate_sheet').toArray();
  }

  async processFile(
    file: File,
    columnMapping: Record<string, number>,
    startLine: number
  ): Promise<{ fileName: string; records: RateSheetRecord[] }> {
    const tableName = 'rate_sheet';

    const db = await this.initializeDB();
    if (!db) throw new Error('Failed to initialize database');

    // Only create new schema if table doesn't exist
    if (!db.tables.some((t: Table) => t.name === tableName)) {
      await db.close();
      db.version(db.verno! + 1).stores({
        [tableName]: '++id, name, prefix, rate, *effective, *minDuration, *increments',
      });
      await db.open();
    }

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: async (results: { data: string[][] }) => {
          try {
            const dataRows = results.data.slice(startLine - 1);
            const records: RateSheetRecord[] = dataRows.map(row => ({
              name: row[columnMapping.name as number]?.trim() || '',
              prefix: row[columnMapping.prefix as number]?.trim() || '',
              rate: parseFloat(row[columnMapping.rate as number]) || 0,
              effective: row[columnMapping.effective as number]?.trim(),
              minDuration: parseInt(row[columnMapping.minDuration as number]) || 1,
              increments: parseInt(row[columnMapping.increments as number]) || 1,
            }));

            await db.table(tableName).clear();
            await db.table(tableName).bulkPut(records);

            // Process records into grouped data
            const groupedData = this.processRecordsIntoGroups(records);
            this.store.setGroupedData(groupedData);
            this.store.setOriginalData(records);

            resolve({ fileName: file.name, records });
          } catch (error) {
            reject(error);
          }
        },
        error: error => reject(new Error(`Failed to process CSV: ${error.message}`)),
      });
    });
  }

  private processRecordsIntoGroups(records: RateSheetRecord[]): GroupedRateData[] {
    // Group records by destination name
    const groupedByName = new Map<string, RateSheetRecord[]>();
    records.forEach(record => {
      const existing = groupedByName.get(record.name) || [];
      groupedByName.set(record.name, [...existing, record]);
    });

    return Array.from(groupedByName.entries()).map(([name, records]) => {
      const rateMap = new Map<number, number>();
      records.forEach(record => {
        const rate = typeof record.rate === 'string' ? parseFloat(record.rate) : record.rate;
        rateMap.set(rate, (rateMap.get(rate) || 0) + 1);
      });

      const totalRecords = records.length;
      const rates: RateStatistics[] = Array.from(rateMap.entries()).map(([rate, count]) => ({
        rate,
        count,
        percentage: (count / totalRecords) * 100,
        isCommon: false,
      }));

      const maxCount = Math.max(...rates.map(r => r.count));
      rates.forEach(rate => {
        rate.isCommon = rate.count === maxCount;
      });

      return {
        destinationName: name,
        codes: records.map(r => r.prefix),
        rates,
        hasDiscrepancy: rateMap.size > 1,
        effectiveDate: records[0]?.effective,
        minDuration: records[0]?.minDuration,
        increments: records[0]?.increments,
      };
    });
  }
}
