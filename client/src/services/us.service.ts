import { type USStandardizedData, type InvalidUsRow } from '@/types/domains/us-types';
import { DBName } from '@/types/app-types';
import Dexie, { Table } from 'dexie';
import { useUsStore } from '@/stores/us-store';
import Papa from 'papaparse';
import useDexieDB from '@/composables/useDexieDB';

// Define the store type to avoid type mismatch
interface UsStore {
  addInvalidRow: (fileName: string, row: InvalidUsRow) => void;
  clearInvalidRowsForFile: (fileName: string) => void;
  // Add other methods as needed
  resetFiles: () => void;
  addFileUploaded: (componentName: string, fileName: string) => void;
}

export class USService {
  private store: UsStore;
  private db: Dexie | null = null;

  constructor() {
    console.log('Initializing US service');
    this.store = useUsStore() as unknown as UsStore;
    this.initializeDB();
  }

  async initializeDB() {
    try {
      if (!this.db) {
        console.log('Creating new Dexie instance for US database');
        const { getDB } = useDexieDB();
        this.db = await getDB(DBName.US);
        
        // Add better error handling for database opening
        try {
          await this.db.open();
          console.log('US database opened successfully');
          console.log('Available tables:', this.db.tables.map(t => t.name).join(', ') || 'None');
        } catch (openError) {
          console.error('Error opening US database:', openError);
          throw openError;
        }
      }
      return this.db;
    } catch (error) {
      console.error('Failed to initialize US database:', error);
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async processFile(
    file: File,
    columnMapping: Record<string, number>,
    startLine: number,
    indeterminateDefinition?: string
  ): Promise<{ fileName: string; records: USStandardizedData[] }> {
    const tableName = file.name.toLowerCase().replace('.csv', '');

    // Clear any existing invalid rows for this file
    this.store.clearInvalidRowsForFile(file.name);

    // Ensure db is initialized
    const db = await this.initializeDB();
    if (!db) throw new Error('Failed to initialize database');

    // Only create new schema if table doesn't exist
    if (!db.tables.some((t: Table) => t.name === tableName)) {
      await db.close();
      db.version(db.verno! + 1).stores({
        [tableName]: '++id, npanxx, npa, nxx, interRate, intraRate, indetermRate',
      });
      await db.open();
    }

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: async (results: { data: string[][] }) => {
          try {
            // Skip to user-specified start line
            const dataRows = results.data.slice(startLine - 1);
            const validRecords: USStandardizedData[] = [];

            dataRows.forEach((row, index) => {
              // Extract values based on column mapping
              let npanxx = '';
              let npa = '';
              let nxx = '';
              
              // Handle NPANXX extraction - either directly or from NPA and NXX
              if (columnMapping.npanxx >= 0) {
                npanxx = row[columnMapping.npanxx]?.trim() || '';
                // If we have NPANXX but not NPA/NXX, extract them
                if (npanxx.length === 6) {
                  npa = npanxx.substring(0, 3);
                  nxx = npanxx.substring(3, 6);
                }
              } else if (columnMapping.npa >= 0 && columnMapping.nxx >= 0) {
                npa = row[columnMapping.npa]?.trim() || '';
                nxx = row[columnMapping.nxx]?.trim() || '';
                npanxx = npa + nxx;
              }

              // Extract rate values
              const interRateStr = columnMapping.interstate >= 0 ? row[columnMapping.interstate] : '';
              const intraRateStr = columnMapping.intrastate >= 0 ? row[columnMapping.intrastate] : '';
              const indetermRateStr = columnMapping.indeterminate >= 0 ? row[columnMapping.indeterminate] : '';

              // Parse rates
              const interRate = parseFloat(interRateStr);
              const intraRate = parseFloat(intraRateStr);
              let indetermRate = parseFloat(indetermRateStr);

              // Handle indeterminate rate based on user selection
              if (isNaN(indetermRate) && indeterminateDefinition) {
                indetermRate = indeterminateDefinition === 'interstate' ? interRate : intraRate;
              }

              // Validate the data
              if (!npanxx || npanxx.length !== 6 || isNaN(interRate) || isNaN(intraRate) || isNaN(indetermRate)) {
                const invalidRow: InvalidUsRow = {
                  rowIndex: startLine + index,
                  npanxx,
                  npa,
                  nxx,
                  interRate: isNaN(interRate) ? interRateStr : interRate,
                  intraRate: isNaN(intraRate) ? intraRateStr : intraRate,
                  indetermRate: isNaN(indetermRate) ? indetermRateStr : indetermRate,
                  reason: !npanxx || npanxx.length !== 6 
                    ? 'Invalid NPANXX format' 
                    : isNaN(interRate) 
                      ? 'Invalid interstate rate' 
                      : isNaN(intraRate) 
                        ? 'Invalid intrastate rate' 
                        : 'Invalid indeterminate rate',
                };
                this.store.addInvalidRow(file.name, invalidRow);
              } else {
                validRecords.push({
                  npanxx,
                  npa,
                  nxx,
                  interRate,
                  intraRate,
                  indetermRate,
                });
              }
            });

            // Store valid records in the database
            if (validRecords.length > 0) {
              console.log(`Storing ${validRecords.length} records to table '${tableName}'`);
              try {
                // First, check if the table exists
                const doesTableExist = db.tables.some(table => table.name === tableName);
                if (!doesTableExist) {
                  console.error(`Table ${tableName} does not exist in the database schema!`);
                  throw new Error(`Table ${tableName} does not exist in the database schema`);
                }
                
                const chunkSize = 1000;
                for (let i = 0; i < validRecords.length; i += chunkSize) {
                  const chunk = validRecords.slice(i, i + chunkSize);
                  console.log(`Inserting chunk ${i / chunkSize + 1}/${Math.ceil(validRecords.length/chunkSize)}, size: ${chunk.length}`);
                  
                  // Add a small delay between chunks to ensure proper DB processing
                  if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                  }
                  
                  try {
                    await db.table(tableName).bulkPut(chunk);
                    console.log(`Successfully inserted chunk ${i / chunkSize + 1}`);
                  } catch (chunkError: unknown) {
                    console.error(`Error inserting chunk ${i / chunkSize + 1}:`, chunkError);
                    console.error('First few records in the failed chunk:', JSON.stringify(chunk.slice(0, 3)));
                    throw chunkError;
                  }
                }
                console.log(`Successfully stored all records to table '${tableName}'`);
              } catch (dbError: unknown) {
                console.error(`Error storing data to IndexedDB table '${tableName}':`, dbError);
                throw new Error(`Failed to store data: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
              }
            } else {
              console.warn(`No valid records to store for file '${file.name}'`);
            }
            
            // We should keep this line - it tells the store that the table should be associated with the file
            this.store.addFileUploaded(file.name, tableName);
            resolve({ fileName: file.name, records: validRecords });
          } catch (error) {
            console.error('Error in processFile:', error);
            reject(error);
          }
        },
        error: error => reject(new Error(`Failed to process CSV: ${error.message}`)),
      });
    });
  }

  async clearData(): Promise<void> {
    try {
      const db = await this.initializeDB();
      if (!db) throw new Error('Failed to initialize database');
      
      // Get all table names
      const tableNames = db.tables.map(table => table.name);
      
      // Close the database to modify schema
      await db.close();
      
      // Create a new version with all tables removed
      const newVersion = db.verno! + 1;
      const schemaDefinition: Record<string, null> = {};
      
      tableNames.forEach(name => {
        schemaDefinition[name] = null;
      });
      
      db.version(newVersion).stores(schemaDefinition);
      
      await db.open();
      this.store.resetFiles();
      
    } catch (error) {
      console.error('Failed to clear US data:', error);
      throw error;
    }
  }

  async removeTable(tableName: string): Promise<void> {
    try {
      console.log(`Attempting to remove table: ${tableName}`);
      const db = await this.initializeDB();
      if (!db) throw new Error('Failed to initialize database');
      
      // Check if the table exists
      if (!db.tables.some(table => table.name === tableName)) {
        console.log(`Table ${tableName} does not exist, nothing to remove.`);
        return;
      }
      
      // Close the database to modify schema
      await db.close();
      
      // Create a new version with this table removed
      const newVersion = db.verno! + 1;
      const schemaDefinition: Record<string, null | string> = {};
      
      // Keep other tables, remove only the specified one
      db.tables.forEach(table => {
        if (table.name === tableName) {
          schemaDefinition[table.name] = null; // Remove this table
        } else {
          // Keep the schema for other tables
          schemaDefinition[table.name] = db.table(table.name).schema.primKey.src;
        }
      });
      
      // Apply the new schema
      db.version(newVersion).stores(schemaDefinition);
      
      await db.open();
      console.log(`Successfully removed table: ${tableName}`);
    } catch (error) {
      console.error(`Failed to remove table ${tableName}:`, error);
      throw error;
    }
  }

  async listTables(): Promise<{ tableName: string; recordCount: number }[]> {
    try {
      const db = await this.initializeDB();
      if (!db) throw new Error('Failed to initialize database');
      
      const tableInfo = [];
      
      for (const table of db.tables) {
        const count = await table.count();
        tableInfo.push({
          tableName: table.name,
          recordCount: count
        });
      }
      
      return tableInfo;
    } catch (error) {
      console.error('Failed to list tables:', error);
      throw new Error(`Failed to list tables: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
