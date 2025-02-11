import Dexie from 'dexie';

// Define database schema versions and configurations
export const DBConfig = {
  LERG: {
    name: 'lerg_db',
    version: 1,
    tables: {
      lerg: 'lerg',
    },
    stores: {
      lerg: 'npa, *state, *country',
    },
  },
  RATE_SHEET: {
    name: 'rate_sheet_db',
    version: 1,
    stores: {
      rate_sheet: '++id, name, prefix, rate, effective, minDuration, increments',
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
export function createDatabase(
  config: typeof DBConfig.LERG | typeof DBConfig.RATE_DECKS | typeof DBConfig.RATE_SHEET
): Dexie {
  const db = new Dexie(config.name);
  console.log('Creating database with stores:', config.stores);
  db.version(config.version).stores(config.stores);
  return db;
}
