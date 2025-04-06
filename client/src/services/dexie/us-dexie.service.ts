import Dexie from 'dexie';
import { BaseDexieService } from './base-dexie.service';
import type { USCodeRecord } from '@/types/domains/us-code-types';

/**
 * US-specific Dexie service for operations on US code data
 */
export class USDexieService extends BaseDexieService<USCodeRecord, string> {
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
  async initializeTable(records: USCodeRecord[]): Promise<void> {
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
   * Get all records for a specific state
   *
   * @param stateCode Two-letter state code
   * @returns Promise resolving to array of US code records
   */
  async getByState(stateCode: string): Promise<USCodeRecord[]> {
    return this.where('state', stateCode);
  }

  /**
   * Get records by area code
   *
   * @param areaCode Area code
   * @returns Promise resolving to array of US code records
   */
  async getByAreaCode(areaCode: string): Promise<USCodeRecord[]> {
    try {
      return await this.table().where('areaCode').equals(areaCode).toArray();
    } catch (error) {
      console.error(`Error getting US codes by area code ${areaCode}:`, error);
      throw error;
    }
  }

  /**
   * Get records by zip code prefix
   *
   * @param zipPrefix Zip code prefix
   * @returns Promise resolving to array of US code records
   */
  async getByZipPrefix(zipPrefix: string): Promise<USCodeRecord[]> {
    try {
      // Use startsWith to match zip code prefixes
      return await this.table()
        .filter((record) => record.zipCode?.startsWith(zipPrefix) ?? false)
        .toArray();
    } catch (error) {
      console.error(`Error getting US codes by zip prefix ${zipPrefix}:`, error);
      throw error;
    }
  }

  /**
   * Get records by city name
   *
   * @param cityName City name
   * @returns Promise resolving to array of US code records
   */
  async getByCity(cityName: string): Promise<USCodeRecord[]> {
    try {
      // Case-insensitive city search
      return await this.table()
        .filter((record) => record.city?.toLowerCase().includes(cityName.toLowerCase()) ?? false)
        .toArray();
    } catch (error) {
      console.error(`Error getting US codes by city ${cityName}:`, error);
      throw error;
    }
  }

  /**
   * Get the last updated timestamp from the records
   *
   * @returns Promise resolving to the last updated timestamp or null
   */
  async getLastUpdatedTimestamp(): Promise<{ lastUpdated: string | null }> {
    try {
      const firstRecord = await this.table().limit(1).first();

      const timestamp = firstRecord?.lastUpdated
        ? new Date(firstRecord.lastUpdated).toISOString()
        : null;

      return { lastUpdated: timestamp };
    } catch (error) {
      console.error('Error getting last updated timestamp:', error);
      return { lastUpdated: null };
    }
  }
}
