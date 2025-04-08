import Dexie from 'dexie';
import { DBName, DBSchemas, isSchemaSupported } from '@/types/app-types';
import { DexieServiceFactory } from './index';

// Each database is separate according to the DBName constants
export class LergDatabase extends Dexie {
  lerg!: Dexie.Table<any, string>;

  constructor() {
    super(DBName.LERG);
    this.version(1).stores({
      lerg: DBSchemas[DBName.LERG],
    });
    console.log(`${DBName.LERG} initialized with schema`);
  }
}

export class USDatabase extends Dexie {
  us_codes!: Dexie.Table<any, string>;

  constructor() {
    super(DBName.US);
    this.version(1).stores({
      us_codes: DBSchemas[DBName.US],
    });
    console.log(`${DBName.US} initialized with schema`);
  }
}

export class AZDatabase extends Dexie {
  az_codes!: Dexie.Table<any, string>;

  constructor() {
    super(DBName.AZ);
    this.version(1).stores({
      az_codes: DBSchemas[DBName.AZ],
    });
    console.log(`${DBName.AZ} initialized with schema`);
  }
}

// Create singleton instances
const lergDB = new LergDatabase();
const usDB = new USDatabase();
const azDB = new AZDatabase();

// Initialize factory with database instances
DexieServiceFactory.setDatabases(lergDB, usDB, azDB);

/**
 * Get the initialized LERG database instance
 */
export function getLergDatabase(): LergDatabase {
  return lergDB;
}

/**
 * Get the initialized US database instance
 */
export function getUSDatabase(): USDatabase {
  return usDB;
}

/**
 * Get the initialized AZ database instance
 */
export function getAZDatabase(): AZDatabase {
  return azDB;
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

// Export the databases and factory
export { lergDB, usDB, azDB, DexieServiceFactory };
