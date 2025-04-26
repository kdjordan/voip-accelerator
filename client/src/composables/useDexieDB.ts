import Dexie, { Table } from 'dexie';
import { type DBNameType, DBName } from '@/types';
import { useDBStore } from '@/stores/db-store';
import { DBSchemas, DynamicTableSchemas } from '@/types/app-types';

export class DexieDBBase extends Dexie {
  [key: string]: Table<any> | any;
  protected stores: Set<string>;
  protected schema: string;
  protected dbName: DBNameType;

  constructor(dbName: DBNameType, initialSchemaDefinition: string) {
    super(dbName);
    this.dbName = dbName;
    this.schema = initialSchemaDefinition;
    this.stores = new Set();

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

    if (dbName === DBName.US_RATE_SHEET) {
      const usRateSheetSchemaV2 = DBSchemas[DBName.US_RATE_SHEET];
      if (usRateSheetSchemaV2) {
        console.log(
          `[useDexieDB] Defining Version 2 upgrade for ${DBName.US_RATE_SHEET} with schema:`,
          usRateSheetSchemaV2
        );
        this.version(2).stores(usRateSheetSchemaV2);
      } else {
        console.error(
          `[useDexieDB] Could not find V2 schema definition for ${DBName.US_RATE_SHEET} in DBSchemas!`
        );
      }
    }
  }

  async addStore(storeName: string): Promise<void> {
    if (this.stores.has(storeName)) return;

    let dynamicSchemaDefinition = '++id';

    if (this.dbName in DynamicTableSchemas) {
      dynamicSchemaDefinition =
        DynamicTableSchemas[this.dbName as keyof typeof DynamicTableSchemas];
    } else {
      console.warn(
        `[useDexieDB] addStore called for DB (${this.dbName}) without a defined dynamic schema in DynamicTableSchemas. Falling back to default.`
      );
    }

    const schema = {
      ...this.getSchemaDefinitionForVersion(this.verno),
      [storeName]: dynamicSchemaDefinition,
    };

    console.log(`[useDexieDB] Adding store '${storeName}' to ${this.dbName} with schema:`, schema);

    this.close();

    try {
      this.version(this.verno + 1).stores(schema);
      await this.open();
      this.stores.add(storeName);
      console.log(
        `[useDexieDB] Successfully added/updated store '${storeName}' in ${this.dbName} and reopened DB.`
      );
    } catch (e) {
      console.error(
        `[useDexieDB] Error during schema upgrade or reopening for ${this.dbName} adding store ${storeName}:`,
        e
      );
      this.close();
      throw e;
    }
  }

  hasStore(storeName: string): boolean {
    return this.tables.some((table) => table.name === storeName);
  }

  async deleteStore(storeName: string): Promise<void> {
    if (!this.hasStore(storeName)) return;

    console.log(`[useDexieDB] Deleting store '${storeName}' from ${this.dbName}...`);
    const currentVersion = this.verno;

    this.close();

    try {
      const nextSchema = this.getSchemaDefinitionForVersion(currentVersion);
      nextSchema[storeName] = null;

      this.version(currentVersion + 1).stores(nextSchema);

      await this.open();

      this.stores.delete(storeName);
      console.log(
        `[useDexieDB] Successfully deleted store '${storeName}' and reopened ${this.dbName}.`
      );
    } catch (error) {
      console.error(`[useDexieDB] Error deleting store '${storeName}' from ${this.dbName}:`, error);
      this.close();
      throw error;
    }
  }

  async getAllStoreNames(): Promise<string[]> {
    return this.tables.map((table) => table.name);
  }

  protected updateStoresSet(): void {
    this.stores = new Set(this.tables.map((table) => table.name));
  }

  async open(): Promise<this> {
    await super.open();
    this.updateStoresSet();
    console.log(
      `[useDexieDB: ${this.dbName}] DB Opened. Version: ${this.verno}. Tables:`,
      Array.from(this.stores)
    );
    return this;
  }

  private getSchemaDefinitionForVersion(versionNumber: number): { [key: string]: string | null } {
    const currentSchema: { [key: string]: string | null } = {};
    const versionSchema = this._dbSchema[versionNumber];
    if (versionSchema) {
      Object.keys(versionSchema.stores).forEach((storeName) => {
        currentSchema[storeName] =
          versionSchema.stores[storeName].primKey.src +
          ',' +
          versionSchema.stores[storeName].indexes.map((idx) => idx.src).join(',');
      });
    }
    console.log(
      `[useDexieDB: ${this.dbName}] Schema for existing stores at v${versionNumber}:`,
      currentSchema
    );
    return currentSchema;
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
      console.warn(`[useDexieDB] Connection for ${dbName} was closed. Attempting to reopen...`);
      try {
        await db.open();
        console.log(`[useDexieDB] Successfully reopened ${dbName}.`);
      } catch (reopenError) {
        console.error(`[useDexieDB] Failed to reopen database ${dbName}:`, reopenError);
        throw reopenError;
      }
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

    try {
      await db.addStore(storeName);
    } catch (error) {
      console.error(
        `[useDexieDB] Failed to add store ${storeName} to ${dbName}. Aborting data storage.`,
        error
      );
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    const table = db.table(storeName);

    const enriched = options?.sourceFile
      ? data.map((d) => ({ ...d, sourceFile: options.sourceFile }))
      : data;

    try {
      if (options?.replaceExisting) {
        console.log(`[useDexieDB: ${dbName}/${storeName}] Clearing existing data before bulkPut.`);
        await table.clear();
      }
      console.log(
        `[useDexieDB: ${dbName}/${storeName}] Starting bulkPut for ${enriched.length} records...`
      );
      await table.bulkPut(enriched);
      console.log(
        `[useDexieDB: ${dbName}/${storeName}] Successfully stored ${enriched.length} records.`
      );
    } catch (error) {
      console.error(`[useDexieDB: ${dbName}/${storeName}] Error during bulkPut:`, error);
      throw error;
    }
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
