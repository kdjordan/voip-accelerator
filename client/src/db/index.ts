import Dexie from 'dexie';
import type { AZTable, USTable, LERGTable, CacheTable } from './types';
import { SCHEMA_DEFINITION } from './schema';

export class VoipAcceleratorDB extends Dexie {
  // Declare tables with correct key types
  az!: Dexie.Table<AZTable>; // Remove number if it's not the actual key type
  us!: Dexie.Table<USTable>;
  lerg!: Dexie.Table<LERGTable>;
  cache!: Dexie.Table<CacheTable>;

  constructor() {
    super('VoipAcceleratorDB');
    this.version(1).stores(SCHEMA_DEFINITION);

    // Rest of the code stays the same...
  }
}

export const db = new VoipAcceleratorDB();

// Handle global database errors
db.open().catch(error => {
  console.error('[Database] Failed to open database:', error);
});
