import Dexie from 'dexie';
import type { USStandardizedData } from '@/types/domains/us-types';
import { BaseDexieService } from './base-dexie.service';

/**
 * US-specific Dexie service for operations on US code data
 */
export class USDexieService extends BaseDexieService<USStandardizedData, string> {
  private static instance: USDexieService | null = null;

  /**
   * Private constructor for singleton pattern
   */
  private constructor(db: Dexie) {
    super(db, 'us_codes');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(db: Dexie): USDexieService {
    if (!USDexieService.instance) {
      USDexieService.instance = new USDexieService(db);
    }
    return USDexieService.instance;
  }

  /**
   * Initialize the US codes table with data
   * Clears existing data and adds new records
   *
   * @param records Array of US code records to add
   */
  async initializeTable(records: USStandardizedData[]): Promise<void> {
    try {
      await this.transaction('rw', async () => {
        // Clear existing data
        await this.clear();

        // Add new records
        if (records.length > 0) {
          await this.bulkAdd(records);
        }
      });

      console.log(`Initialized US codes table with ${records.length} records`);
    } catch (error) {
      console.error('Failed to initialize US codes table:', error);
      throw error;
    }
  }

  /**
   * Get US records by NPA (area code)
   * @param npa The NPA (area code)
   * @returns Promise resolving to array of US code records
   */
  async getByNpa(npa: string): Promise<USStandardizedData[]> {
    try {
      // Use 'npa' index
      return await this.table().where('npa').equals(npa).toArray();
    } catch (error) {
      console.error(`Error getting US records by NPA ${npa}:`, error);
      return [];
    }
  }

  /**
   * Get US records by NPANXX
   * @param npanxx The NPANXX
   * @returns Promise resolving to array of US code records
   */
  async getByNpanxx(npanxx: string): Promise<USStandardizedData[]> {
    try {
      // Use 'npanxx' index
      return await this.table().where('npanxx').equals(npanxx).toArray();
    } catch (error) {
      console.error(`Error getting US records by NPANXX ${npanxx}:`, error);
      return [];
    }
  }
}
