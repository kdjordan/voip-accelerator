import { AZStandardizedData } from '@/types/az-types';
import { createDatabase, DBConfig } from '@/config/database';
import { useAzStore } from '@/stores/az-store';
import Dexie from 'dexie';
import Papa from 'papaparse';

export class AZService {
  private store = useAzStore();
  private db: Dexie;

  constructor() {
    console.log('Initializing AZ service with database:', DBConfig.AZ_RATE_DECK.name);
    this.db = createDatabase(DBConfig.AZ_RATE_DECK);
    console.log('AZ service initialized with database:', this.db);
    this.db.open().then(() => {
      console.log('Database opened successfully');
      console.log(
        'Tables:',
        this.db.tables.map(t => t.name)
      );
    });
  }

  async processFile(
    file: File,
    columnMapping: Record<string, number>,
    startLine: number
  ): Promise<{ fileName: string; records: AZStandardizedData[] }> {
    const tableName = file.name.toLowerCase().replace('.csv', '');

    // Only create new schema if table doesn't exist
    if (!this.db.tables.some(t => t.name === tableName)) {
      await this.db.close();
      this.db.version(this.db.verno! + 1).stores({
        [tableName]: '++id, destName, dialCode, rate',
      });
      await this.db.open();
    }

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: async (results: { data: string[][] }) => {
          try {
            // Skip to user-specified start line
            const dataRows = results.data.slice(startLine - 1);
            console.log('Data rows:', dataRows);
            console.log('Column mapping:', columnMapping);
            const records: AZStandardizedData[] = dataRows.map(row => {
              // The columnMapping should contain the indices selected by user
              return {
                destName: row[columnMapping.destination]?.trim() || '',
                dialCode: row[columnMapping.dialcode]?.trim() || '',
                rate: parseFloat(row[columnMapping.rate]) || 0,
              };
            });
            console.log('Records:', records);

            // Store in the new table
            const chunkSize = 1000;
            for (let i = 0; i < records.length; i += chunkSize) {
              const chunk = records.slice(i, i + chunkSize);
              await this.db.table(tableName).bulkPut(chunk);
            }

            this.store.addFileUploaded(file.name, tableName);
            resolve({ fileName: file.name, records });
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
      await this.db.table('az').clear();
      this.store.resetFiles();
    } catch (error) {
      console.error('Failed to clear AZ data:', error);
      throw error;
    }
  }

  async removeTable(tableName: string): Promise<void> {
    try {
      // Close the database to modify schema
      await this.db.close();

      // Remove the table by setting it to null in the next version
      this.db.version(this.db.verno! + 1).stores({
        [tableName]: null, // This deletes the table
      });

      await this.db.open();
      console.log(`Table ${tableName} removed successfully`);
    } catch (error) {
      console.error(`Failed to remove table ${tableName}:`, error);
      throw error;
    }
  }
}
