import Dexie from 'dexie';

// Define database schema versions and configurations
export const DBConfig = {
  LERG: {
    name: 'lerg_db',
    version: 1,
    tables: {
      lerg: 'lerg',
      specialCodes: 'special_codes',
      stateMappings: 'state_mappings',
    },
    schema: {
      lerg: '++id, npanxx, state, npa, nxx',
      specialCodes: '++id, npa, country, province',
      stateMappings: 'state, npas',
    },
    stores: {
      lerg: 'npanxx, npa, nxx, state',
      special_area_codes: '++id, npa, country, description, last_updated',
      state_mappings: 'state, npas',
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
  console.log('Creating database with stores:', config.stores);
  db.version(config.version).stores(config.stores);
  return db;
}
