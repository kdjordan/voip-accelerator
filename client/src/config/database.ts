import Dexie from 'dexie';

// Each database has its own config and version
export const DBConfig = {
  LERG: {
    name: 'lerg_db',
    version: 1,
    stores: {
      lerg: 'npa, *state, *country',
    },
  },
  AZ_RATE_DECK: {
    name: 'az_rate_deck_db',
    version: 1,
    stores: {}, // Start with empty stores
  },
  US_RATE_DECK: {
    name: 'us_rate_deck_db',
    version: 1,
    stores: {
      us: '++id, npa, nxx, npanxx, interRate, intraRate, indetermRate, &npanxx',
    },
  },
  RATE_SHEET: {
    name: 'rate_sheet_db',
    version: 1,
    stores: {
      rate_sheet: '++id, name, prefix, rate, effective, minDuration, increments',
    },
  },
} as const;

// Cache DB instances
const dbInstances: Record<string, Dexie> = {};

// Create a new database instance
export function createDatabase(config: (typeof DBConfig)[keyof typeof DBConfig]): Dexie {
  if (!dbInstances[config.name]) {
    console.log(`Creating database: ${config.name} (v${config.version})`);
    const db = new Dexie(config.name);
    console.log('Setting up schema:', config.stores);
    db.version(config.version).stores(config.stores);
    dbInstances[config.name] = db;
  }
  return dbInstances[config.name];
}

// Get an existing database instance
export function getDatabase(name: string): Dexie | undefined {
  return dbInstances[name];
}
