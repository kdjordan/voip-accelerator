import Dexie from 'dexie';
import type { AZTable, USTable, LERGTable, CacheTable } from './types';
import { SCHEMA_DEFINITION } from './schema';

export class VoipAcceleratorDB extends Dexie {
  // Declare tables
  az!: Dexie.Table<AZTable, number>;
  us!: Dexie.Table<USTable, number>;
  lerg!: Dexie.Table<LERGTable, number>;
  cache!: Dexie.Table<CacheTable, number>;

  constructor() {
    super('VoipAcceleratorDB');

    this.version(1).stores(SCHEMA_DEFINITION);

    // Add hooks for timestamps
    this.on('creating', function (this: Dexie.Table<any>, primKey: any, obj: any) {
      const now = new Date();
      obj.createdAt = now;
      obj.updatedAt = now;
    });

    this.on('updating', function (this: Dexie.Table<any>, modifications: any, primKey: any, obj: any) {
      modifications.updatedAt = new Date();
    });

    // Add error logging
    this.on('error', function (this: Dexie.Table<any>, error: any) {
      console.error('[Database Error]:', error);
    });

    // Log ready state
    this.on('ready', function (this: Dexie.Table<any>) {
      console.info('[Database] Connected successfully');
    });

    // Log blocked state
    this.on('blocked', function (this: Dexie.Table<any>) {
      console.warn('[Database] Blocked - another instance is running');
    });

    // Log version change
    this.on('versionchange', function (this: Dexie.Table<any>, event: any) {
      console.info('[Database] Version changed:', event);
    });
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.open();
      return true;
    } catch (error) {
      console.error('[Database Health Check] Failed:', error);
      return false;
    }
  }
}

export const db = new VoipAcceleratorDB();

// Handle global database errors
db.open().catch(error => {
  console.error('[Database] Failed to open database:', error);
});
