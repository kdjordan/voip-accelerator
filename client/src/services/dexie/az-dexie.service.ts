import Dexie from 'dexie';
import type { AZStandardizedData } from '@/types/domains/az-types';
import { BaseDexieService } from './base-dexie.service';

/**
 * AZ-specific Dexie service for operations on AZ code data
 */
export class AZDexieService extends BaseDexieService<AZStandardizedData, string> {
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
  async initializeTable(records: AZStandardizedData[]): Promise<void> {
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
   * Get AZ code records by dial code
   * @param azCode The dial code to search for
   * @returns Promise resolving to AZ code record if found
   */
  async getByDialCode(dialCode: string): Promise<AZStandardizedData | undefined> {
    try {
      // Use the correct property 'dialCode'
      return await this.table().where('dialCode').equals(dialCode).first();
    } catch (error) {
      console.error(`Error getting AZ record by dial code ${dialCode}:`, error);
      return undefined;
    }
  }

  /**
   * Search AZ code records based on criteria
   * @param criteria Partial record with search criteria
   * @returns Promise resolving to array of matching AZ code records
   */
  async search(criteria: Partial<AZStandardizedData>): Promise<AZStandardizedData[]> {
    try {
      let collection = this.table().toCollection();

      // Filter by dialCode if provided
      if (criteria.dialCode) {
        collection = collection.filter((rec) => rec.dialCode === criteria.dialCode);
      }

      // Filter by destName (case-insensitive) if provided
      if (criteria.destName) {
        const lowerDestName = criteria.destName.toLowerCase();
        collection = collection.filter(
          (rec) => rec.destName?.toLowerCase().includes(lowerDestName) ?? false
        );
      }

      // Add other relevant filters if needed based on AZStandardizedData fields

      return await collection.toArray();
    } catch (error) {
      console.error('Error searching AZ records:', error);
      return [];
    }
  }
}
