import Dexie from 'dexie';
import { BaseDexieService } from './base-dexie.service';
import type { LERGRecord, NPAEntry } from '@/types/domains/lerg-types';
import { STATE_CODES } from '@/types/constants/state-codes';
import { PROVINCE_CODES } from '@/types/constants/province-codes';

/**
 * LERG-specific Dexie service for operations on LERG data
 */
export class LergDexieService extends BaseDexieService<LERGRecord, string> {
  private static instance: LergDexieService | null = null;

  /**
   * Private constructor for singleton pattern
   */
  private constructor(db: Dexie) {
    super(db, 'lerg');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(db: Dexie): LergDexieService {
    if (!LergDexieService.instance) {
      LergDexieService.instance = new LergDexieService(db);
    }
    return LergDexieService.instance;
  }

  /**
   * Initialize the LERG table with data
   * Clears existing data and adds new records
   *
   * @param records Array of LERG records to add
   */
  async initializeTable(records: LERGRecord[]): Promise<void> {
    try {
      await this.transaction('rw', async () => {
        // Clear existing data
        await this.clear();

        // Add new records
        if (records.length > 0) {
          await this.bulkAdd(records);
        }
      });

      console.log(`Initialized LERG table with ${records.length} records`);
    } catch (error) {
      console.error('Failed to initialize LERG table:', error);
      throw error;
    }
  }

  /**
   * Get all records for a specific country
   *
   * @param countryCode Two-letter country code
   * @returns Promise resolving to array of LERG records
   */
  async getByCountry(countryCode: string): Promise<LERGRecord[]> {
    return this.where('country').equals(countryCode).toArray();
  }

  /**
   * Get all records for a specific state/province
   *
   * @param stateCode Two-letter state/province code
   * @returns Promise resolving to array of LERG records
   */
  async getByState(stateCode: string): Promise<LERGRecord[]> {
    return this.where('state').equals(stateCode).toArray();
  }

  /**
   * Get a record by NPA
   *
   * @param npa Three-digit NPA code
   * @returns Promise resolving to LERG record if found
   */
  async getByNPA(npa: string): Promise<LERGRecord | undefined> {
    try {
      const results = await this.where('npa').equals(npa).first();
      return results;
    } catch (error) {
      console.error(`Error getting LERG record for NPA ${npa}:`, error);
      return undefined;
    }
  }

  /**
   * Check if an NPA exists in the database
   *
   * @param npa Three-digit NPA code
   * @returns Promise resolving to boolean indicating if NPA exists
   */
  async hasNPA(npa: string): Promise<boolean> {
    try {
      const count = await this.table().where('npa').equals(npa).count();

      return count > 0;
    } catch (error) {
      console.error(`Error checking if NPA ${npa} exists:`, error);
      throw error;
    }
  }

  /**
   * Check if a state code belongs to the United States
   *
   * @param stateCode Two-letter state code
   * @returns Boolean indicating if state code is a US state
   */
  isUSState(stateCode: string): boolean {
    return stateCode in STATE_CODES;
  }

  /**
   * Check if a province code belongs to Canada
   *
   * @param provinceCode Two-letter province code
   * @returns Boolean indicating if province code is a Canadian province
   */
  isCanadianProvince(provinceCode: string): boolean {
    return provinceCode in PROVINCE_CODES;
  }

  /**
   * Get the last updated timestamp from the records
   *
   * @returns Promise resolving to the last updated timestamp or null
   */
  async getLastUpdatedTimestamp(): Promise<{ lastUpdated: string | null }> {
    try {
      const firstRecord = await this.table().limit(1).first();

      const timestamp = firstRecord?.last_updated
        ? new Date(firstRecord.last_updated).toISOString()
        : null;

      return { lastUpdated: timestamp };
    } catch (error) {
      console.error('Error getting last updated timestamp:', error);
      return { lastUpdated: null };
    }
  }
}
