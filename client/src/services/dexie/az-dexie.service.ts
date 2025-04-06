import Dexie from 'dexie';
import { BaseDexieService } from './base-dexie.service';
import type { AZCodeRecord } from '@/types/domains/az-code-types';

/**
 * AZ-specific Dexie service for operations on AZ code data
 */
export class AZDexieService extends BaseDexieService<AZCodeRecord, string> {
  private static instance: AZDexieService | null = null;

  /**
   * Private constructor for singleton pattern
   */
  private constructor(db: Dexie) {
    super(db, 'az_codes');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(db: Dexie): AZDexieService {
    if (!AZDexieService.instance) {
      AZDexieService.instance = new AZDexieService(db);
    }
    return AZDexieService.instance;
  }

  /**
   * Initialize the AZ codes table with data
   * Clears existing data and adds new records
   *
   * @param records Array of AZ code records to add
   */
  async initializeTable(records: AZCodeRecord[]): Promise<void> {
    try {
      await this.transaction('rw', async () => {
        // Clear existing data
        await this.clear();

        // Add new records
        if (records.length > 0) {
          await this.bulkAdd(records);
        }
      });

      console.log(`Initialized AZ codes table with ${records.length} records`);
    } catch (error) {
      console.error('Failed to initialize AZ codes table:', error);
      throw error;
    }
  }

  /**
   * Get records by AZ code
   *
   * @param azCode The AZ code
   * @returns Promise resolving to AZ code record if found
   */
  async getByCode(azCode: string): Promise<AZCodeRecord | undefined> {
    try {
      const results = await this.where('code', azCode);
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error(`Error getting AZ record for code ${azCode}:`, error);
      throw error;
    }
  }

  /**
   * Get records by state
   *
   * @param stateCode Two-letter state code
   * @returns Promise resolving to array of AZ code records
   */
  async getByState(stateCode: string): Promise<AZCodeRecord[]> {
    return this.where('state', stateCode);
  }

  /**
   * Get records by country
   *
   * @param countryCode Two-letter country code
   * @returns Promise resolving to array of AZ code records
   */
  async getByCountry(countryCode: string): Promise<AZCodeRecord[]> {
    return this.where('country', countryCode);
  }

  /**
   * Get records by city name
   *
   * @param cityName City name
   * @returns Promise resolving to array of AZ code records
   */
  async getByCity(cityName: string): Promise<AZCodeRecord[]> {
    try {
      // Case-insensitive city search
      return await this.table()
        .filter((record) => record.city?.toLowerCase().includes(cityName.toLowerCase()) ?? false)
        .toArray();
    } catch (error) {
      console.error(`Error getting AZ codes by city ${cityName}:`, error);
      throw error;
    }
  }

  /**
   * Search records by multiple criteria
   *
   * @param criteria Search criteria object
   * @returns Promise resolving to array of matching AZ code records
   */
  async search(criteria: Partial<AZCodeRecord>): Promise<AZCodeRecord[]> {
    try {
      let collection = this.table().toCollection();

      // Apply filters for each provided criteria
      if (criteria.code) {
        collection = collection.filter((rec) => rec.code === criteria.code);
      }

      if (criteria.state) {
        collection = collection.filter((rec) => rec.state === criteria.state);
      }

      if (criteria.country) {
        collection = collection.filter((rec) => rec.country === criteria.country);
      }

      if (criteria.city) {
        collection = collection.filter(
          (rec) => rec.city?.toLowerCase().includes(criteria.city!.toLowerCase()) ?? false
        );
      }

      return await collection.toArray();
    } catch (error) {
      console.error('Error searching AZ codes:', error);
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
