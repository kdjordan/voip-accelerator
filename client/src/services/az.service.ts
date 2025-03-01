import { type AZStandardizedData, type InvalidAzRow } from '@/types/domains/az-types';
import { DBName } from '@/types/app-types';
import Dexie, { Table } from 'dexie';
import { useAzStore } from '@/stores/az-store';
import Papa from 'papaparse';
import useDexieDB from '@/composables/useDexieDB';

export class AZService {
  private store = useAzStore();
  private db: Dexie | null = null;

  constructor() {
    console.log('Initializing AZ service');
    this.initializeDB();
  }

  async initializeDB() {
    if (!this.db) {
      const { getDB } = useDexieDB();
      this.db = await getDB(DBName.AZ);
      await this.db.open();
    }
    return this.db;
  }

  async processFile(
    file: File,
    columnMapping: Record<string, number>,
    startLine: number
  ): Promise<{ fileName: string; records: AZStandardizedData[] }> {
    const tableName = file.name.toLowerCase().replace('.csv', '');

    // Clear any existing invalid rows for this file
    this.store.clearInvalidRowsForFile(file.name);

    // Ensure db is initialized
    const db = await this.initializeDB();
    if (!db) throw new Error('Failed to initialize database');

    // Only create new schema if table doesn't exist
    if (!db.tables.some((t: Table) => t.name === tableName)) {
      await db.close();
      db.version(db.verno! + 1).stores({
        [tableName]: '++id, destName, dialCode, rate',
      });
      await db.open();
    }

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: async (results: { data: string[][] }) => {
          try {
            // Skip to user-specified start line
            const dataRows = results.data.slice(startLine - 1);
            const validRecords: AZStandardizedData[] = [];

            dataRows.forEach((row, index) => {
              const destName = row[columnMapping.destination]?.trim() || '';
              const dialCode = row[columnMapping.dialcode]?.trim() || '';
              const rateStr = row[columnMapping.rate];
              const rate = parseFloat(rateStr);

              // Validate the rate - if not a valid number, add to invalid rows
              if (isNaN(rate) || !destName || !dialCode) {
                const invalidRow: InvalidAzRow = {
                  rowIndex: startLine + index,
                  destName,
                  dialCode,
                  invalidRate: rateStr || '',
                  reason: isNaN(rate) ? 'Invalid rate' : !destName ? 'Missing destination name' : 'Missing dial code',
                };
                this.store.addInvalidRow(file.name, invalidRow);
              } else {
                validRecords.push({
                  destName,
                  dialCode,
                  rate,
                });
              }
            });

            // Store valid records in the database
            if (validRecords.length > 0) {
              const chunkSize = 1000;
              for (let i = 0; i < validRecords.length; i += chunkSize) {
                const chunk = validRecords.slice(i, i + chunkSize);
                await db.table(tableName).bulkPut(chunk);
              }
            }

            this.store.addFileUploaded(file.name, tableName);
            resolve({ fileName: file.name, records: validRecords });
          } catch (error) {
            reject(error);
          }
        },
        error: error => reject(new Error(`Failed to process CSV: ${error.message}`)),
      });
    });
  }

  async clearData(): Promise<void> {
    try {
      const db = await this.initializeDB();
      if (!db) throw new Error('Failed to initialize database');
      await db.table('az').clear();
      this.store.resetFiles();
      
    } catch (error) {
      console.error('Failed to clear AZ data:', error);
      throw error;
    }
  }

  async removeTable(tableName: string): Promise<void> {
    try {
      const db = await this.initializeDB();
      if (!db) throw new Error('Failed to initialize database');

      // Close the database to modify schema
      await db.close();

      // Remove the table by setting it to null in the next version
      db.version(db.verno! + 1).stores({
        [tableName]: null, // This deletes the table
      });

      await db.open();
      console.log(`Table ${tableName} removed successfully`);
    } catch (error) {
      console.error(`Failed to remove table ${tableName}:`, error);
      throw error;
    }
  }
}
