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
 * This ensures we're using the correct Dexie database instances across services
 */
export class DexieServiceFactory {
  private static lergDB: Dexie | null = null;
  private static usDB: Dexie | null = null;
  private static azDB: Dexie | null = null;

  /**
   * Set the Dexie database instances for the factory
   */
  static setDatabases(lergDB: Dexie, usDB: Dexie, azDB: Dexie): void {
    DexieServiceFactory.lergDB = lergDB;
    DexieServiceFactory.usDB = usDB;
    DexieServiceFactory.azDB = azDB;
  }

  /**
   * Get the LERG Dexie service instance
   *
   * @returns LergDexieService instance
   */
  static getLergService(): LergDexieService {
    if (!DexieServiceFactory.lergDB) {
      throw new Error('LERG database not initialized. Call setDatabases first.');
    }
    return LergDexieService.getInstance(DexieServiceFactory.lergDB);
  }

  /**
   * Get the US Dexie service instance
   *
   * @returns USDexieService instance
   */
  static getUSService(): USDexieService {
    if (!DexieServiceFactory.usDB) {
      throw new Error('US database not initialized. Call setDatabases first.');
    }
    return USDexieService.getInstance(DexieServiceFactory.usDB);
  }

  /**
   * Get the AZ Dexie service instance
   *
   * @returns AZDexieService instance
   */
  static getAZService(): AZDexieService {
    if (!DexieServiceFactory.azDB) {
      throw new Error('AZ database not initialized. Call setDatabases first.');
    }
    return AZDexieService.getInstance(DexieServiceFactory.azDB);
  }
}

// Example usage in application init:
// import { db } from './db';
// DexieServiceFactory.setDatabase(db);
//
// // Then elsewhere in the app:
// const lergService = DexieServiceFactory.getLergService();
