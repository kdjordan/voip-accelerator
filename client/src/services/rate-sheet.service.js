import { useRateSheetStore } from '@/stores/rate-sheet-store';
import { DBName } from '@/types/app-types';
import useDexieDB from '@/composables/useDexieDB';
import Papa from 'papaparse';
export class RateSheetService {
    store = useRateSheetStore();
    db = null;
    constructor() {
        console.log('Initializing Rate Sheet service');
        this.initializeDB();
    }
    async initializeDB() {
        if (!this.db) {
            const { getDB } = useDexieDB();
            this.db = await getDB(DBName.RATE_SHEET);
            await this.db.open();
        }
        return this.db;
    }
    async processRateSheetData(data) {
        try {
            const db = await this.initializeDB();
            if (!db)
                throw new Error('Failed to initialize database');
            // Only create new schema if table doesn't exist
            if (!db.tables.some((t) => t.name === 'rate_sheet')) {
                await db.close();
                db.version(db.verno + 1).stores({
                    rate_sheet: '++id, name, prefix, rate, *effective, *minDuration, *increments',
                });
                await db.open();
            }
            await db.table('rate_sheet').clear();
            await db.table('rate_sheet').bulkPut(data);
            console.log('Rate sheet data processed successfully');
        }
        catch (error) {
            console.error('Failed to process rate sheet data:', error);
            throw error;
        }
    }
    async clearData() {
        try {
            const db = await this.initializeDB();
            if (!db)
                throw new Error('Failed to initialize database');
            await db.table('rate_sheet').clear();
            this.store.$reset();
        }
        catch (error) {
            console.error('Failed to clear rate sheet data:', error);
            throw error;
        }
    }
    async getRateSheetData() {
        const db = await this.initializeDB();
        if (!db)
            throw new Error('Failed to initialize database');
        return await db.table('rate_sheet').toArray();
    }
    async processFile(file, columnMapping, startLine) {
        const tableName = 'rate_sheet';
        const db = await this.initializeDB();
        if (!db)
            throw new Error('Failed to initialize database');
        // Only create new schema if table doesn't exist
        if (!db.tables.some((t) => t.name === tableName)) {
            await db.close();
            db.version(db.verno + 1).stores({
                [tableName]: '++id, name, prefix, rate, *effective, *minDuration, *increments',
            });
            await db.open();
        }
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: false,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        const dataRows = results.data.slice(startLine - 1);
                        const records = dataRows.map(row => ({
                            name: row[columnMapping.name]?.trim() || '',
                            prefix: row[columnMapping.prefix]?.trim() || '',
                            rate: parseFloat(row[columnMapping.rate]) || 0,
                            effective: row[columnMapping.effective]?.trim(),
                            minDuration: parseInt(row[columnMapping.minDuration]) || 1,
                            increments: parseInt(row[columnMapping.increments]) || 1,
                        }));
                        await db.table(tableName).clear();
                        await db.table(tableName).bulkPut(records);
                        // Process records into grouped data
                        const groupedData = this.processRecordsIntoGroups(records);
                        this.store.setGroupedData(groupedData);
                        this.store.setOriginalData(records);
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
    processRecordsIntoGroups(records) {
        // Group records by destination name
        const groupedByName = new Map();
        records.forEach(record => {
            const existing = groupedByName.get(record.name) || [];
            groupedByName.set(record.name, [...existing, record]);
        });
        return Array.from(groupedByName.entries()).map(([name, records]) => {
            const rateMap = new Map();
            records.forEach(record => {
                const rate = typeof record.rate === 'string' ? parseFloat(record.rate) : record.rate;
                rateMap.set(rate, (rateMap.get(rate) || 0) + 1);
            });
            const totalRecords = records.length;
            const rates = Array.from(rateMap.entries()).map(([rate, count]) => ({
                rate,
                count,
                percentage: (count / totalRecords) * 100,
                isCommon: false,
            }));
            const maxCount = Math.max(...rates.map(r => r.count));
            rates.forEach(rate => {
                rate.isCommon = rate.count === maxCount;
            });
            return {
                destinationName: name,
                codes: records.map(r => r.prefix),
                rates,
                hasDiscrepancy: rateMap.size > 1,
                effectiveDate: records[0]?.effective,
                minDuration: records[0]?.minDuration,
                increments: records[0]?.increments,
            };
        });
    }
}
