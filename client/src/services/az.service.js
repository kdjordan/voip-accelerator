import { DBName } from '@/types/app-types';
import { useAzStore } from '@/stores/az-store';
import Papa from 'papaparse';
import useDexieDB from '@/composables/useDexieDB';
export class AZService {
    store = useAzStore();
    db = null;
    constructor() {
        console.log('Initializing AZ service');
        this.initializeDB();
    }
    async initializeDB() {
        if (!this.db) {
            const { getDB } = useDexieDB();
            this.db = await getDB(DBName.AZ);
            await this.db.open();
        }
        return this.db;
    }
    async processFile(file, columnMapping, startLine) {
        const tableName = file.name.toLowerCase().replace('.csv', '');
        // Ensure db is initialized
        const db = await this.initializeDB();
        if (!db)
            throw new Error('Failed to initialize database');
        // Only create new schema if table doesn't exist
        if (!db.tables.some((t) => t.name === tableName)) {
            await db.close();
            db.version(db.verno + 1).stores({
                [tableName]: '++id, destName, dialCode, rate',
            });
            await db.open();
        }
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: false,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        // Skip to user-specified start line
                        const dataRows = results.data.slice(startLine - 1);
                        const records = dataRows.map(row => {
                            // The columnMapping should contain the indices selected by user
                            return {
                                destName: row[columnMapping.destination]?.trim() || '',
                                dialCode: row[columnMapping.dialcode]?.trim() || '',
                                rate: parseFloat(row[columnMapping.rate]) || 0,
                            };
                        });
                        // Store in the new table
                        const chunkSize = 1000;
                        for (let i = 0; i < records.length; i += chunkSize) {
                            const chunk = records.slice(i, i + chunkSize);
                            await db.table(tableName).bulkPut(chunk);
                        }
                        this.store.addFileUploaded(file.name, tableName);
                        resolve({ fileName: file.name, records });
                    }
                    catch (error) {
                        reject(error);
                    }
                },
                error: error => reject(new Error(`Failed to process CSV: ${error.message}`)),
            });
        });
    }
    async clearData() {
        try {
            const db = await this.initializeDB();
            if (!db)
                throw new Error('Failed to initialize database');
            await db.table('az').clear();
            this.store.resetFiles();
        }
        catch (error) {
            console.error('Failed to clear AZ data:', error);
            throw error;
        }
    }
    async removeTable(tableName) {
        try {
            const db = await this.initializeDB();
            if (!db)
                throw new Error('Failed to initialize database');
            // Close the database to modify schema
            await db.close();
            // Remove the table by setting it to null in the next version
            db.version(db.verno + 1).stores({
                [tableName]: null, // This deletes the table
            });
            await db.open();
            console.log(`Table ${tableName} removed successfully`);
        }
        catch (error) {
            console.error(`Failed to remove table ${tableName}:`, error);
            throw error;
        }
    }
}
