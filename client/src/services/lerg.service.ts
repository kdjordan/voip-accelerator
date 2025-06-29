import Dexie, { Table } from 'dexie';
import type { LERGRecord, StateNPAMapping, CountryLergData } from '@/types/domains/lerg-types';
import type { EnhancedLERGRecord } from '@/composables/useEnhancedLERG';
import { useLergStore } from '@/stores/lerg-store';
import { DBName } from '@/types/app-types';
import useDexieDB from '@/composables/useDexieDB';
import { STATE_CODES } from '@/types/constants/state-codes';
import { PROVINCE_CODES } from '@/types/constants/province-codes';

/**
 * Custom error types for LERG service operations
 */
export class LergServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LergServiceError';
  }
}

export class LergConnectionError extends LergServiceError {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(`LERG database connection error: ${message}`);
    this.name = 'LergConnectionError';
  }
}

export class LergDataError extends LergServiceError {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(`LERG data error: ${message}`);
    this.name = 'LergDataError';
  }
}

export class LergSchemaError extends LergServiceError {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(`LERG schema error: ${message}`);
    this.name = 'LergSchemaError';
  }
}

/**
 * Service for managing LERG data in IndexedDB
 * Implemented as a singleton to ensure consistent database access
 */
export class LergService {
  // Singleton instance
  private static instance: LergService | null = null;

  private store = useLergStore();
  private db: Dexie | null = null;

  // Connection management properties
  private connectionCount = 0;
  private isConnecting = false;
  private connectionError: Error | null = null;

  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 500;

  // Cache for processed data
  private processedDataCache: {
    stateMapping: StateNPAMapping | null;
    canadaProvinces: Record<string, Set<string>> | null;
    countryData: CountryLergData[] | null;
    timestamp: number;
    recordCount: number;
  } = {
    stateMapping: null,
    canadaProvinces: null,
    countryData: null,
    timestamp: 0,
    recordCount: 0,
  };

  // Cache expiration time in milliseconds (5 minutes)
  private readonly CACHE_EXPIRATION_MS = 5 * 60 * 1000;

  /**
   * Private constructor to prevent direct instantiation
   * Use LergService.getInstance() instead
   */
  private constructor() {}

  /**
   * Get the singleton instance of LergService
   * @returns The singleton instance
   */
  public static getInstance(): LergService {
    if (!LergService.instance) {
      LergService.instance = new LergService();
    }
    return LergService.instance;
  }

  /**
   * Execute a database operation with retry logic for transient errors
   * @param operation The operation to execute
   * @param operationName Name of the operation for logging
   * @param maxRetries Maximum number of retries
   * @returns The result of the operation
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if we've reached the maximum number of retries
        if (attempt > maxRetries) {
          console.error(`${operationName} failed after ${maxRetries} retries:`, error);
          throw lastError;
        }

        // Only retry for specific error types that might be transient
        const errorMessage = lastError.message.toLowerCase();
        const isTransient =
          errorMessage.includes('timeout') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('network') ||
          errorMessage.includes('temporarily');

        if (!isTransient) {
          console.error(`${operationName} failed with non-transient error:`, error);
          throw lastError;
        }

        // Wait before retrying
        const delay = this.RETRY_DELAY_MS * attempt;
        console.warn(
          `${operationName} failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // This should never happen, but TypeScript requires a return
    throw lastError || new LergServiceError(`${operationName} failed for unknown reason`);
  }

  /**
   * Get a connection to the database
   * Phase 1: Uses useDexieDB for initialization, keeps existing connection management
   * @returns A promise that resolves to the database instance
   */
  async getConnection(): Promise<Dexie> {
    try {
      // Initialize DB if needed using managed getDB()
      if (!this.db) {
        console.log('[LergService] Phase 1: Initializing database using useDexieDB...');
        const { getDB } = useDexieDB();
        this.db = await this.executeWithRetry(
          async () => await getDB(DBName.LERG),
          'Database initialization via useDexieDB'
        );
        console.log('[LergService] Phase 1: Database initialized successfully via useDexieDB');
      }

      // Keep existing connection management for Phase 1
      // Open the database if it's not already open
      if (!this.db.isOpen() && !this.isConnecting) {
        this.isConnecting = true;
        try {
          await this.executeWithRetry(async () => await this.db!.open(), 'Database open');
          this.connectionError = null;
          console.log('[LergService] Phase 1: Database opened successfully');
        } catch (error) {
          const connectionError = error instanceof Error ? error : new Error(String(error));
          this.connectionError = new LergConnectionError(
            'Failed to open database connection',
            connectionError
          );
          console.error('Failed to open LERG database:', error);
          throw this.connectionError;
        } finally {
          this.isConnecting = false;
        }
      }

      // Increment connection count (keeping existing logic for Phase 1)
      this.connectionCount++;
      return this.db;
    } catch (error) {
      const connectionError = error instanceof Error ? error : new Error(String(error));
      throw new LergConnectionError('Error getting database connection', connectionError);
    }
  }

  /**
   * Release a database connection
   * When all connections are released, the database will be closed
   */
  async releaseConnection(): Promise<void> {
    if (!this.db) return;

    this.connectionCount = Math.max(0, this.connectionCount - 1);

    // Only close if no active connections and not in the middle of an operation
    if (this.connectionCount === 0 && this.db.isOpen() && !this.isConnecting) {
      try {
        await this.executeWithRetry(async () => await this.db!.close(), 'Database close');
      } catch (error) {
        console.error('Error closing LERG database connection:', error);
      }
    }
  }

  /**
   * Check if the database has a connection error
   * @returns True if there is a connection error
   */
  hasConnectionError(): boolean {
    return this.connectionError !== null;
  }

  /**
   * Get the current connection error if any
   * @returns The connection error or null
   */
  getConnectionError(): Error | null {
    return this.connectionError;
  }

  /**
   * Get the current connection count
   * @returns The number of active connections
   */
  getConnectionCount(): number {
    return this.connectionCount;
  }

  /**
   * Check if the database is currently connecting
   * @returns True if the database is connecting
   */
  isCurrentlyConnecting(): boolean {
    return this.isConnecting;
  }

  /**
   * Deprecated: Use getConnection() instead
   * Kept for backward compatibility
   */
  async initializeDB() {
    console.warn('initializeDB() is deprecated, use getConnection() instead');
    return this.getConnection();
  }

  /**
   * Check if the cache is valid
   * @returns True if the cache is valid and can be used
   */
  private isCacheValid(): boolean {
    const now = Date.now();
    const cacheAge = now - this.processedDataCache.timestamp;

    return (
      this.processedDataCache.stateMapping !== null &&
      this.processedDataCache.canadaProvinces !== null &&
      this.processedDataCache.countryData !== null &&
      this.processedDataCache.recordCount > 0 &&
      cacheAge < this.CACHE_EXPIRATION_MS
    );
  }

  /**
   * Invalidate the processed data cache
   * This should be called whenever the LERG data changes
   */
  invalidateCache(): void {
    this.processedDataCache = {
      stateMapping: null,
      canadaProvinces: null,
      countryData: null,
      timestamp: 0,
      recordCount: 0,
    };
  }

  /**
   * Check if enhanced LERG data exists in the database
   * @returns Promise resolving to true if data exists, false otherwise
   */
  async hasData(): Promise<boolean> {
    try {
      const db = await this.getConnection();

      // Check if enhanced_lerg table exists
      if (!db.tables.some((t) => t.name === 'enhanced_lerg')) {
        return false;
      }

      // Check if there are records
      const count = await db.table('enhanced_lerg').count();
      return count > 0;
    } catch (error) {
      console.error('Error checking if enhanced LERG data exists:', error);
      return false;
    } finally {
      await this.releaseConnection();
    }
  }

  /**
   * Get the count of enhanced LERG records in the database
   * @returns Promise resolving to the number of records
   */
  async getRecordCount(): Promise<number> {
    try {
      const db = await this.getConnection();

      // Check if enhanced_lerg table exists
      if (!db.tables.some((t) => t.name === 'enhanced_lerg')) {
        return 0;
      }

      // Get the count
      return await db.table('enhanced_lerg').count();
    } catch (error) {
      console.error('Error getting enhanced LERG record count:', error);
      return 0;
    } finally {
      await this.releaseConnection();
    }
  }

  /**
   * Initialize the LERG table with data
   * @param lergData The LERG data to initialize
   */
  async initializeLergTable(lergData: EnhancedLERGRecord[]): Promise<void> {
    console.log('[LergService] ========== STARTING INDEXEDDB INITIALIZATION ==========');
    console.log('[LergService] Input data length:', lergData.length);
    console.log('[LergService] Sample input record:', lergData[0]);
    
    try {
      console.log('[LergService] Getting database connection...');
      
      // Phase 1: Clear any existing database to avoid schema conflicts
      console.log('[LergService] Phase 1: Clearing existing database to avoid schema conflicts...');
      
      // Reset our internal DB reference first
      if (this.db) {
        console.log('[LergService] Phase 1: Closing existing database connection...');
        await this.db.close();
        this.db = null;
        this.connectionCount = 0;
      }
      
      // Force delete the database using Dexie.delete directly
      try {
        console.log('[LergService] Phase 1: Force deleting database with Dexie.delete...');
        await Dexie.delete(DBName.LERG);
        console.log('[LergService] Phase 1: Database force deleted successfully');
        
        // Wait a moment for IndexedDB to fully process the deletion
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (deleteError) {
        console.log('[LergService] Phase 1: Error deleting database (may not exist):', deleteError);
      }
      
      // Phase 1: Get managed database connection with fresh schema
      console.log('[LergService] Phase 1: Getting managed database connection...');
      const db = await this.getConnection();
      if (!db) {
        console.error('[LergService] ERROR: Failed to get database connection');
        throw new LergConnectionError('Failed to initialize database');
      }
      console.log('[LergService] Phase 1: Database connection obtained via useDexieDB');
      
      // Phase 1: Verify the enhanced_lerg table exists or will be created
      const tableNames = db.tables.map(t => t.name);
      console.log('[LergService] Phase 1: Available tables:', tableNames);
      
      if (!tableNames.includes('enhanced_lerg')) {
        console.log('[LergService] Phase 1: enhanced_lerg table not found, useDexieDB should handle schema creation');
      } else {
        console.log('[LergService] Phase 1: enhanced_lerg table found');
      }

      // Phase 1: Clear existing data (keeping existing table structure)
      console.log('[LergService] Phase 1: Clearing enhanced_lerg table...');
      await db.table('enhanced_lerg').clear();
      console.log('[LergService] Phase 1: Table cleared successfully');

      // Insert the data in smaller batches to avoid transaction limits
      const BATCH_SIZE = 1000;
      let processedCount = 0;
      const totalBatches = Math.ceil(lergData.length / BATCH_SIZE);

      console.log(`[LergService] Starting batch insertion: ${totalBatches} batches of ${BATCH_SIZE} records each`);

      for (let i = 0; i < lergData.length; i += BATCH_SIZE) {
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const batch = lergData.slice(i, i + BATCH_SIZE);
        
        console.log(`[LergService] Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)`);
        console.log(`[LergService] Sample record from batch ${batchNumber}:`, batch[0]);
        
        await this.executeWithRetry(
          async () => {
            console.log(`[LergService] Phase 1: Executing bulkPut for batch ${batchNumber}...`);
            const result = await db.table('enhanced_lerg').bulkPut(batch);
            console.log(`[LergService] Phase 1: bulkPut result for batch ${batchNumber}:`, result);
            return result;
          },
          `Data batch ${batchNumber} insertion`
        );

        processedCount += batch.length;
        const progressPercent = Math.round((processedCount / lergData.length) * 100);
        console.log(`[LergService] Batch ${batchNumber} complete: ${progressPercent}% total progress (${processedCount}/${lergData.length})`);
      }

      // Phase 1: Verify data was stored
      console.log('[LergService] Phase 1: Verifying data storage...');
      const storedCount = await db.table('enhanced_lerg').count();
      console.log(`[LergService] Phase 1: Verification: ${storedCount} records stored in enhanced_lerg table`);
      
      if (storedCount !== lergData.length) {
        console.error(`[LergService] Phase 1: ERROR: Storage verification failed! Expected ${lergData.length}, got ${storedCount}`);
        throw new Error(`Storage verification failed: ${storedCount}/${lergData.length} records stored`);
      }

      // Get a sample record to verify structure
      const sampleStored = await db.table('enhanced_lerg').limit(1).first();
      console.log('[LergService] Phase 1: Sample stored record:', sampleStored);

      // Invalidate cache since data has changed
      console.log('[LergService] Invalidating cache...');
      this.invalidateCache();
      
      console.log('[LergService] ========== PHASE 1: INDEXEDDB INITIALIZATION COMPLETE ==========');
    } catch (error) {
      console.error('[LergService] ========== PHASE 1: INDEXEDDB INITIALIZATION FAILED ==========');
      console.error('[LergService] Phase 1: Error details:', error);
      console.error('[LergService] Phase 1: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      const dataError = error instanceof Error ? error : new Error(String(error));
      throw new LergDataError('Failed to initialize LERG data', dataError);
    } finally {
      console.log('[LergService] Phase 1: Cleanup: Releasing connection...');
      await this.releaseConnection();
    }
  }

  /**
   * Get all enhanced LERG records from the database
   * @returns Promise resolving to an array of enhanced LERG records
   */
  async getLergData(): Promise<EnhancedLERGRecord[]> {
    try {
      const db = await this.getConnection();

      if (!db.isOpen()) {
        await this.executeWithRetry(async () => await db.open(), 'Database open for getLergData');
      }

      return await db.table('enhanced_lerg').toArray();
    } catch (error) {
      const dataError = error instanceof Error ? error : new Error(String(error));
      throw new LergDataError('Failed to get enhanced LERG data', dataError);
    } finally {
      await this.releaseConnection();
    }
  }

  /**
   * Clear all LERG data from the database and store
   */
  async clearLergData(): Promise<void> {
    try {
      // Get DB reference
      const db = await this.getConnection();

      // Make sure the database is open
      if (!db.isOpen()) {
        await this.executeWithRetry(async () => await db.open(), 'Database open for clearLergData');
      }

      // Clear IndexedDB table if it exists
      if (db.tables.some((t) => t.name === 'enhanced_lerg')) {
        await this.executeWithRetry(async () => await db.table('enhanced_lerg').clear(), 'Clear enhanced LERG table');
      }

      // Clear store using the new clearLergData method
      const store = useLergStore();
      store.clearLergData();

      // Invalidate cache
      this.invalidateCache();
    } catch (error) {
      const dataError = error instanceof Error ? error : new Error(String(error));
      throw new LergDataError('Failed to clear LERG data', dataError);
    } finally {
      await this.releaseConnection();
    }
  }

  /**
   * Get processed LERG data with caching
   * @param forceRefresh Force a refresh of the cache
   * @returns Promise resolving to processed LERG data including canadaProvinces
   */
  async getProcessedData(forceRefresh = false): Promise<{
    stateMapping: StateNPAMapping;
    canadaProvinces: Record<string, Set<string>>;
    countryData: CountryLergData[];
    count: number;
  }> {
    if (!forceRefresh && this.isCacheValid()) {
      return {
        stateMapping: this.processedDataCache.stateMapping!,
        canadaProvinces: this.processedDataCache.canadaProvinces!,
        countryData: this.processedDataCache.countryData!,
        count: this.processedDataCache.recordCount,
      };
    }

    const result = await this.processLergData();
    const count = await this.getRecordCount();

    this.processedDataCache = {
      stateMapping: result.stateMapping,
      canadaProvinces: result.canadaProvinces,
      countryData: result.countryData,
      timestamp: Date.now(),
      recordCount: count,
    };

    return {
      ...result,
      count,
    };
  }

  /**
   * Process LERG data into application format
   * @returns Promise resolving to processed LERG data including canadaProvinces
   */
  async processLergData(): Promise<{
    stateMapping: StateNPAMapping;
    canadaProvinces: Record<string, Set<string>>;
    countryData: CountryLergData[];
  }> {
    try {
      const db = await this.getConnection();

      // Ensure database is open
      if (!db.isOpen()) {
        await this.executeWithRetry(
          async () => await db.open(),
          'Database open for processLergData'
        );
      }

      // Check if enhanced_lerg table exists
      if (!db.tables.some((t) => t.name === 'enhanced_lerg')) {
        return {
          stateMapping: {},
          canadaProvinces: {},
          countryData: [],
        };
      }

      // Get the total count first
      const totalCount = await db.table('enhanced_lerg').count();
      
      if (totalCount === 0) {
        console.warn('[LergService] enhanced_lerg table is empty');
        return {
          stateMapping: {},
          canadaProvinces: {},
          countryData: [],
        };
      }

      console.log(`[LergService] Processing ${totalCount} enhanced LERG records`);

      // Process data in chunks for better memory usage with large datasets
      const CHUNK_SIZE = 5000;
      const stateMapping: StateNPAMapping = {};
      const canadaProvinces: Record<string, Set<string>> = {};
      const countryMap = new Map<string, Set<string>>();

      // Process data in chunks
      let offset = 0;
      while (offset < totalCount) {
        const records = await db.table('enhanced_lerg').offset(offset).limit(CHUNK_SIZE).toArray();

        // Process this chunk (convert enhanced records to basic format for compatibility)
        const basicRecords = records
          .filter((record: any) => record && record.npa) // Filter out undefined/invalid records
          .map((record: any) => ({
            npa: record.npa || record.NPA,
            state: record.state_province_code || record.state || record.STATE || 'XX',
            country: record.country_code || record.country || record.COUNTRY || 'XX'
          }))
          .filter((record: any) => record.npa && record.state && record.country); // Ensure all required fields
        
        if (basicRecords.length > 0) {
          this.processDataChunk(basicRecords, stateMapping, canadaProvinces, countryMap);
        }

        offset += CHUNK_SIZE;
      }

      // Convert country map to CountryLergData array
      const countryData: CountryLergData[] = Array.from(countryMap.entries()).map(
        ([country, npas]) => ({
          country,
          npaCount: npas.size,
          npas: Array.from(npas).sort(),
          // Add provinces for Canada
          provinces:
            country === 'CA'
              ? Object.entries(canadaProvinces).map(([code, npas]) => ({
                  code,
                  npas: Array.from(npas).sort(),
                }))
              : undefined,
        })
      );

      // Return all processed structures
      return {
        stateMapping,
        canadaProvinces,
        countryData: countryData.sort((a, b) => b.npaCount - a.npaCount),
      };
    } catch (error) {
      const dataError = error instanceof Error ? error : new Error(String(error));
      throw new LergDataError('Failed to process LERG data', dataError);
    } finally {
      await this.releaseConnection();
    }
  }

  /**
   * Process a chunk of LERG data
   * Helper method for processLergData to handle data in chunks
   */
  private processDataChunk(
    records: LERGRecord[],
    stateMapping: StateNPAMapping,
    canadaProvinces: Record<string, Set<string>>,
    countryMap: Map<string, Set<string>>
  ): void {
    // Filter out any invalid records first
    const validRecords = records.filter(record => 
      record && 
      record.npa && 
      record.state && 
      record.country &&
      typeof record.npa === 'string' &&
      typeof record.state === 'string' &&
      typeof record.country === 'string'
    );

    if (validRecords.length === 0) {
      console.warn('[LergService] No valid records to process in chunk');
      return;
    }

    // First pass - identify all US records including California
    const usRecords = validRecords.filter(
      (record) => record.country === 'US' || (record.state === 'CA' && record.country === 'US')
    );

    // Second pass - identify true Canadian records
    const canadianRecords = validRecords.filter((record) => record.country === 'CA');

    // Third pass - other countries
    const otherRecords = validRecords.filter(
      (record) => record.country !== 'US' && record.country !== 'CA'
    );

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
      countryMap.get('US')!.add(record.npa);
    }

    // Process Canadian records
    for (const record of canadianRecords) {
      // Check if state code is a valid Canadian province code
      // Use the record's state code or map to a valid province if needed
      let provinceCode = record.state;

      // If not a valid province code, see if we can infer it (some datasets use numeric codes)
      if (!this.isCanadianProvince(provinceCode)) {
        // For now, associate all unrecognized Canadian NPAs with a special "UNKNOWN" code
        // This ensures they at least show up in the UI
        provinceCode = 'XX'; // Special code for unknown provinces

        // Add this mapping to the stateMapping for consistency
        if (!stateMapping[provinceCode]) {
          stateMapping[provinceCode] = [];
        }
        if (!stateMapping[provinceCode].includes(record.npa)) {
          stateMapping[provinceCode].push(record.npa);
        }
      }

      // Add to the canadaProvinces map for this province
      if (!canadaProvinces[provinceCode]) {
        canadaProvinces[provinceCode] = new Set();
      }
      canadaProvinces[provinceCode].add(record.npa);

      // Also add to the country map for CA
      if (!countryMap.has('CA')) {
        countryMap.set('CA', new Set());
      }
      countryMap.get('CA')!.add(record.npa);
    }

    // Process other countries
    for (const record of otherRecords) {
      // Ensure the country code is valid before processing
      if (record.country && record.country.trim() !== '') {
        if (!countryMap.has(record.country)) {
          countryMap.set(record.country, new Set());
        }
        countryMap.get(record.country)!.add(record.npa);
      }
    }
  }

  /**
   * Get the last updated timestamp from the database
   * @returns Promise resolving to the last updated timestamp
   */
  public async getLastUpdatedTimestamp(): Promise<{ lastUpdated: string | null }> {
    try {
      const db = await this.getConnection();

      // Get the timestamp from the first record
      const lergTable = db.table('enhanced_lerg');
      const firstRecord = await lergTable.limit(1).first();

      const timestamp = firstRecord?.updated_at || firstRecord?.last_updated
        ? new Date(firstRecord.updated_at || firstRecord.last_updated).toISOString()
        : null;

      return {
        lastUpdated: timestamp,
      };
    } catch (error) {
      console.error('Error getting last updated timestamp:', error);
      return { lastUpdated: null };
    } finally {
      await this.releaseConnection();
    }
  }

  /**
   * Get all enhanced LERG records from the database
   * @returns Promise resolving to an array of all enhanced LERG records
   */
  public async getAllRecords(): Promise<EnhancedLERGRecord[]> {
    try {
      const db = await this.getConnection();
      const lergTable = db.table('enhanced_lerg');

      // Get all records - use limit to avoid memory issues if the dataset is extremely large
      const MAX_RECORDS = 50000; // Adjust based on your expected dataset size
      const records = await lergTable.limit(MAX_RECORDS).toArray();

      return records;
    } catch (error) {
      console.error('Error getting all enhanced LERG records:', error);
      throw new LergDataError(
        'Failed to retrieve all enhanced LERG records',
        error instanceof Error ? error : undefined
      );
    } finally {
      this.releaseConnection();
    }
  }

  /**
   * Check if a state code belongs to the United States
   * @param stateCode The state code to check
   * @returns True if the state code belongs to the US
   */
  public isUSState(stateCode: string): boolean {
    return stateCode in STATE_CODES;
  }

  /**
   * Check if a province code belongs to Canada
   * @param provinceCode The province code to check
   * @returns True if the province code belongs to Canada
   */
  public isCanadianProvince(provinceCode: string): boolean {
    return provinceCode in PROVINCE_CODES;
  }

  async processFile(
    file: File,
    columnMapping: Record<string, number>,
    startLine: number
  ): Promise<{ fileName: string; records: any[] }> {
    // Use a consistent table name
    const tableName = 'lerg';
    const { storeInDexieDB } = useDexieDB();

    // Implementation of processFile method
    // This is a placeholder and should be replaced with the actual implementation
    // based on the file processing logic
    return { fileName: '', records: [] };
  }
}
