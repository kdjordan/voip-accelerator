import { type USStandardizedData } from '@/types/domains/us-types';
import { DBName } from '@/types/app-types';
import Dexie, { Table } from 'dexie';
import { useUsStore } from '@/stores/us-store';
import Papa from 'papaparse';
import useDexieDB from '@/composables/useDexieDB';

export class USService {
  private store = useUsStore();
  private db: Dexie | null = null;

  constructor() {
    this.initializeDB();
  }

  async initializeDB() {
    if (!this.db) {
      const { getDB } = useDexieDB();
      this.db = await getDB(DBName.US);
      await this.db.open();
    }
    return this.db;
  }

  async processFile(
    file: File,
    columnMapping: Record<string, number>,
    startLine: number
  ): Promise<{ fileName: string; records: USStandardizedData[] }> {
    const tableName = file.name.toLowerCase().replace('.csv', '');

    // Ensure db is initialized
    const db = await this.initializeDB();
    if (!db) throw new Error('Failed to initialize database');

    // Only create new schema if table doesn't exist
    if (!db.tables.some((t: Table) => t.name === tableName)) {
      await db.close();
      db.version(db.verno! + 1).stores({
        [tableName]: '++id, npa, nxx, npanxx, interRate, intraRate, indetermRate, &npanxx',
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
            const records: USStandardizedData[] = dataRows.map(row => ({
              npa: row[columnMapping.npa]?.trim() || '',
              nxx: row[columnMapping.nxx]?.trim() || '',
              npanxx: `${row[columnMapping.npa]?.trim() || ''}${row[columnMapping.nxx]?.trim() || ''}`,
              interRate: parseFloat(row[columnMapping.interRate]) || 0,
              intraRate: parseFloat(row[columnMapping.intraRate]) || 0,
              indetermRate: parseFloat(row[columnMapping.indetermRate]) || 0,
            }));

            // Store in chunks
            const chunkSize = 1000;
            for (let i = 0; i < records.length; i += chunkSize) {
              const chunk = records.slice(i, i + chunkSize);
              await db.table(tableName).bulkPut(chunk);
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
      const db = await this.initializeDB();
      if (!db) throw new Error('Failed to initialize database');
      await db.table('us').clear();
      this.store.resetFiles();
    } catch (error) {
      console.error('Failed to clear US data:', error);
      throw error;
    }
  }

  async removeTable(tableName: string): Promise<void> {
    try {
      const db = await this.initializeDB();
      if (!db) throw new Error('Failed to initialize database');

      await db.close();
      db.version(db.verno! + 1).stores({
        [tableName]: null,
      });
      await db.open();
      console.log(`Table ${tableName} removed successfully`);
    } catch (error) {
      console.error(`Failed to remove table ${tableName}:`, error);
      throw error;
    }
  }
}
