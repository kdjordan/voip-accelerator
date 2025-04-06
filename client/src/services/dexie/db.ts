import Dexie from 'dexie';
import { DBName, DBSchemas, isSchemaSupported } from '@/types/app-types';
import { DexieServiceFactory } from './index';

/**
 * Main Dexie database instance for the application
 */
class AppDatabase extends Dexie {
  // Define tables as properties
  lerg!: Dexie.Table<any, string>;
  us_codes!: Dexie.Table<any, string>;
  az_codes!: Dexie.Table<any, string>;

  constructor() {
    super('voip_accelerator');

    // Initialize DB with schema versions
    this.version(1).stores({
      lerg: DBSchemas[DBName.LERG],
      us_codes: DBSchemas[DBName.US],
      az_codes: DBSchemas[DBName.AZ],
    });

    console.log('AppDatabase initialized with schemas');
  }
}

// Create singleton instance
const db = new AppDatabase();

// Initialize factory with database instance
DexieServiceFactory.setDatabase(db);

/**
 * Get the initialized database instance
 * @returns AppDatabase instance
 */
export function getDatabase(): AppDatabase {
  return db;
}

/**
 * Get a service for LERG operations
 * @returns LergDexieService instance
 */
export function getLergService() {
  return DexieServiceFactory.getLergService();
}

/**
 * Get a service for US code operations
 * @returns USDexieService instance
 */
export function getUSService() {
  return DexieServiceFactory.getUSService();
}

/**
 * Get a service for AZ code operations
 * @returns AZDexieService instance
 */
export function getAZService() {
  return DexieServiceFactory.getAZService();
}

// Export the database and factory
export { db, DexieServiceFactory };
