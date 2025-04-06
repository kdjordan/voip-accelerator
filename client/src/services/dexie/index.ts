export { BaseDexieService } from './base-dexie.service';
export { LergDexieService } from './lerg-dexie.service';
export { USDexieService } from './us-dexie.service';
export { AZDexieService } from './az-dexie.service';

// Re-export database setup if needed in the future
// export { db } from './db';

/**
 * Factory module for creating Dexie service instances.
 * This provides a clean way to get access to the database services.
 */
import Dexie from 'dexie';
import { LergDexieService } from './lerg-dexie.service';
import { USDexieService } from './us-dexie.service';
import { AZDexieService } from './az-dexie.service';

/**
 * DexieServiceFactory class for getting service instances
 * This ensures we're using the same Dexie database instance across services
 */
export class DexieServiceFactory {
  private static db: Dexie | null = null;

  /**
   * Set the Dexie database instance for the factory
   *
   * @param dexieDB Dexie database instance
   */
  static setDatabase(dexieDB: Dexie): void {
    DexieServiceFactory.db = dexieDB;
  }

  /**
   * Get the LERG Dexie service instance
   *
   * @returns LergDexieService instance
   */
  static getLergService(): LergDexieService {
    if (!DexieServiceFactory.db) {
      throw new Error('Database not initialized. Call setDatabase first.');
    }
    return LergDexieService.getInstance(DexieServiceFactory.db);
  }

  /**
   * Get the US Dexie service instance
   *
   * @returns USDexieService instance
   */
  static getUSService(): USDexieService {
    if (!DexieServiceFactory.db) {
      throw new Error('Database not initialized. Call setDatabase first.');
    }
    return USDexieService.getInstance(DexieServiceFactory.db);
  }

  /**
   * Get the AZ Dexie service instance
   *
   * @returns AZDexieService instance
   */
  static getAZService(): AZDexieService {
    if (!DexieServiceFactory.db) {
      throw new Error('Database not initialized. Call setDatabase first.');
    }
    return AZDexieService.getInstance(DexieServiceFactory.db);
  }
}

// Example usage in application init:
// import { db } from './db';
// DexieServiceFactory.setDatabase(db);
//
// // Then elsewhere in the app:
// const lergService = DexieServiceFactory.getLergService();
