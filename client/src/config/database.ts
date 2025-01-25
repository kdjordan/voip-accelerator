import Dexie from 'dexie';

// Define database schema versions and configurations
export const DBConfig = {
  LERG: {
    name: 'lerg_db',
    version: 1,
    stores: {
      lerg: 'npanxx, state, npa, nxx',
      special_codes: 'npa, country, description',
    },
  },
  RATE_DECKS: {
    name: 'rate_decks_db',
    version: 1,
    stores: {
      az: '++id, destName, dialCode, rate',
      us: '++id, npa, nxx, npanxx, interRate, intraRate, indetermRate, &npanxx',
    },
  },
} as const;

// Create database instances
export function createDatabase(config: typeof DBConfig.LERG | typeof DBConfig.RATE_DECKS): Dexie {
  const db = new Dexie(config.name);
  db.version(config.version).stores(config.stores);
  return db;
}
