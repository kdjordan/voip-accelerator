import { useLergStore } from '@/stores/lerg-store';
import { DBName } from '@/types/app-types';
import useDexieDB from '@/composables/useDexieDB';
export class LergService {
    store = useLergStore();
    db = null;
    constructor() {
        console.log('Initializing LERG service');
        this.initializeDB();
    }
    async initializeDB() {
        if (!this.db) {
            const { getDB } = useDexieDB();
            this.db = await getDB(DBName.LERG);
            await this.db.open();
        }
        return this.db;
    }
    async initializeLergTable(lergData) {
        try {
            const db = await this.initializeDB();
            if (!db)
                throw new Error('Failed to initialize database');
            // Only create new schema if table doesn't exist
            if (!db.tables.some((t) => t.name === 'lerg')) {
                await db.close();
                db.version(db.verno + 1).stores({
                    lerg: '++id, npa, *state, *country',
                });
                await db.open();
            }
            await db.table('lerg').clear();
            await db.table('lerg').bulkPut(lergData);
            console.log('Data initialization completed successfully');
        }
        catch (error) {
            console.error('Failed to clear LERG data:', error);
            throw error;
        }
    }
    async getLergData() {
        const db = await this.initializeDB();
        return await db.table('lerg').toArray();
    }
    async clearLergData() {
        try {
            // Clear IndexDB
            const db = await this.initializeDB();
            await db.table('lerg').clear();
            console.log('IndexDB LERG data cleared');
            // Clear store
            const store = useLergStore();
            store.$patch({
                isProcessing: false,
                isLocallyStored: false,
                stateNPAs: {},
                countryData: [],
                stats: {
                    totalRecords: 0,
                    lastUpdated: null,
                },
            });
        }
        catch (error) {
            console.error('Failed to clear LERG data:', error);
            throw error;
        }
    }
    async processLergData() {
        const db = await this.initializeDB();
        const records = await db.table('lerg').toArray();
        console.log('Records from IndexedDB:', records);
        // Process state mappings
        const stateMapping = {};
        const canadaProvinces = {};
        const countryMap = new Map();
        // First pass - identify all US records including California
        const usRecords = records.filter(record => record.country === 'US' || (record.state === 'CA' && record.country === 'US'));
        // Second pass - identify true Canadian records
        const canadianRecords = records.filter(record => record.country === 'CA' && !(record.state === 'CA' && record.country === 'US'));
        // Third pass - other countries
        const otherRecords = records.filter(record => record.country !== 'US' && record.country !== 'CA');
        // Process US records
        for (const record of usRecords) {
            if (!stateMapping[record.state]) {
                stateMapping[record.state] = [];
            }
            if (!stateMapping[record.state].includes(record.npa)) {
                stateMapping[record.state].push(record.npa);
            }
            if (!countryMap.has('US')) {
                countryMap.set('US', new Set());
            }
            countryMap.get('US').add(record.npa);
        }
        // Process Canadian records
        for (const record of canadianRecords) {
            if (!canadaProvinces[record.state]) {
                canadaProvinces[record.state] = new Set();
            }
            canadaProvinces[record.state].add(record.npa);
            if (!countryMap.has('CA')) {
                countryMap.set('CA', new Set());
            }
            countryMap.get('CA').add(record.npa);
        }
        // Process other countries
        for (const record of otherRecords) {
            if (!countryMap.has(record.country)) {
                countryMap.set(record.country, new Set());
            }
            countryMap.get(record.country).add(record.npa);
        }
        // Convert country map to CountryLergData array
        const countryData = Array.from(countryMap.entries()).map(([country, npas]) => ({
            country,
            npaCount: npas.size,
            npas: Array.from(npas).sort(),
            // Add provinces for Canada
            provinces: country === 'CA'
                ? Object.entries(canadaProvinces).map(([code, npas]) => ({
                    code,
                    npas: Array.from(npas).sort(),
                }))
                : undefined,
        }));
        return {
            stateMapping,
            countryData: countryData.sort((a, b) => b.npaCount - a.npaCount),
        };
    }
}
