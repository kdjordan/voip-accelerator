import Dexie from 'dexie';
import Papa from 'papaparse';
import { createDatabase, DBConfig } from '@/config/database';
import type { AZStandardizedData } from '@/types/az-types';
import { useAzStore } from '@/stores/az-store';

export class AZCSVService {
  private db: Dexie;
  private store = useAzStore();

  constructor() {
    this.db = createDatabase(DBConfig.RATE_DECKS);
  }

  async generatePreview(file: File) {
    return new Promise<{ headers: string[]; data: string[][] }>((resolve, reject) => {
      Papa.parse(file, {
        preview: 5, // Preview first 5 rows
        complete: (results) => {
          resolve({
            headers: results.data[0] as string[],
            data: results.data.slice(1) as string[][],
          });
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        },
      });
    });
  }

  async processFile(file: File, config: { columnRoles: string[]; startLine: number }) {
    return new Promise<void>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().trim(),
        complete: async (results) => {
          try {
            const records: AZStandardizedData[] = results.data.map((row: any) => ({
              destName: row[config.columnRoles[0]],
              dialCode: row[config.columnRoles[1]],
              rate: parseFloat(row[config.columnRoles[2]]),
            }));

            // Store in IndexedDB
            await this.db.table('az').bulkPut(records);
            
            // Update store
            this.store.addFileUploaded(file.name, file.name);
            
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(new Error(`Failed to process CSV: ${error.message}`));
        },
      });
    });
  }
}
