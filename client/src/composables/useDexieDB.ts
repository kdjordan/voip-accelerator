import Dexie, { Table } from 'dexie';
import { type DBNameType } from '@/types';
import { useDBStore } from '@/stores/db-store';
import { DBSchemas } from '@/types/app-types';

export class DexieDBBase extends Dexie {
  [key: string]: Table<any> | any;
  protected stores: Set<string>;
  protected schema: string;
  protected dbName: DBNameType;

  constructor(dbName: DBNameType, schema: string) {
    super(dbName);
    this.dbName = dbName;
    this.schema = schema;
    this.stores = new Set(this.tables.map((table) => table.name));

    if (this.verno === 0 && this.schema.includes(':')) {
      try {
        const schemaParts = this.schema.split(':');
        const tableName = schemaParts[0].trim();
        const tableDefinition = schemaParts.slice(1).join(':').trim();

        const version1Schema = { [tableName]: tableDefinition };
        console.log(
          `[useDexieDB] Defining Version 1 for ${this.dbName} with schema:`,
          version1Schema
        );
        this.version(1).stores(version1Schema);
      } catch (e) {
        console.error(
          `[useDexieDB] Error parsing schema for ${this.dbName}:`,
          e,
          `Schema: ${this.schema}`
        );
        this.version(1).stores({});
      }
    } else if (this.verno === 0) {
      this.version(1).stores({});
    }
  }

  async addStore(storeName: string) {
    if (this.stores.has(storeName)) return;
    this.stores.add(storeName);

    const schema = {
      [storeName]:
        '++id, npa, nxx, npanxx, interRate, intraRate, indetermRate, *npanxxIdx, sourceFile',
    };

    await this.close();
    this.version(this.verno + 1).stores(schema);
    await this.open();
  }

  hasStore(storeName: string): boolean {
    return this.tables.some((table) => table.name === storeName);
  }

  async deleteStore(storeName: string): Promise<void> {
    if (!this.hasStore(storeName)) return;

    await this.close();
    const freshDb = new DexieDBBase(this.dbName, '');
    freshDb.version(this.verno + 1).stores({ [storeName]: null });
    await freshDb.open();
    this.stores.delete(storeName);
  }

  async getAllStoreNames(): Promise<string[]> {
    return this.tables.map((table) => table.name);
  }
}

export default function useDexieDB() {
  const dbStore = useDBStore();

  async function getDB(dbName: DBNameType): Promise<DexieDBBase> {
    let db = dbStore.activeConnections[dbName] as DexieDBBase;

    if (!db) {
      const schema = DBSchemas[dbName] ?? '';

      if (!schema.includes(':')) {
        db = new DexieDBBase(dbName, '');
      } else {
        db = new DexieDBBase(dbName, schema);
      }

      try {
        await db.open();
        console.log(
          `[useDexieDB] Opened ${dbName}. Tables:`,
          db.tables.map((t) => t.name)
        );
        dbStore.registerConnection(dbName, db);
      } catch (error) {
        console.error(`[useDexieDB] Failed to open database ${dbName}:`, error);
        throw error;
      }
    } else if (!db.isOpen()) {
      await db.open();
    }

    return db;
  }

  async function storeInDexieDB<T>(
    data: T[],
    dbName: DBNameType,
    storeName: string,
    options?: { sourceFile?: string; replaceExisting?: boolean }
  ) {
    const db = await getDB(dbName);
    await db.addStore(storeName);

    const enriched = options?.sourceFile
      ? data.map((d) => ({ ...d, sourceFile: options.sourceFile }))
      : data;

    if (options?.replaceExisting) {
      await db.table(storeName).clear();
    }

    await db.table(storeName).bulkPut(enriched);
  }

  async function loadFromDexieDB<T>(dbName: DBNameType, storeName: string): Promise<T[]> {
    const db = await getDB(dbName);
    if (!db.hasStore(storeName)) return [];
    return db.table(storeName).toArray();
  }

  async function loadPagedFromDexieDB<T>(
    dbName: DBNameType,
    storeName: string,
    limit: number,
    offset: number
  ): Promise<T[]> {
    const db = await getDB(dbName);
    if (!db.hasStore(storeName)) return [];
    return db.table<T>(storeName).offset(offset).limit(limit).toArray();
  }

  async function deleteDatabase(dbName: DBNameType): Promise<void> {
    await dbStore.closeConnection(dbName);
    await Dexie.delete(dbName);
  }

  async function closeAllConnections(): Promise<void> {
    const connections = Object.keys(dbStore.activeConnections) as DBNameType[];
    for (const dbName of connections) {
      await dbStore.closeConnection(dbName);
    }
  }

  return {
    getDB,
    storeInDexieDB,
    loadFromDexieDB,
    loadPagedFromDexieDB,
    deleteDatabase,
    closeAllConnections,
  };
}
