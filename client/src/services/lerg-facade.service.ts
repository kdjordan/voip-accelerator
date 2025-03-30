import { LergService, LergDataError, LergConnectionError } from '@/services/lerg.service';
import {
  lergApiService,
  LergApiError,
  LergNetworkError,
  LergServerError,
  InitState,
} from '@/services/lerg-api.service';
import { useLergStore } from '@/stores/lerg-store';
import { useDBStore } from '@/stores/db-store';
import { DBName } from '@/types/app-types';
import type { NpaRecord, LERGRecord } from '@/types/domains/lerg-types';
import { PROVINCE_CODES } from '@/types/constants/province-codes';
import { STATE_CODES } from '@/types/constants/state-codes';

/**
 * Error types for the LERG Facade Service
 */
export class LergFacadeError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'LergFacadeError';
  }
}

/**
 * Specific error types for different operations
 */
export class LergInitializationError extends LergFacadeError {
  constructor(message: string, public originalError?: Error) {
    super(`Initialization error: ${message}`, originalError);
    this.name = 'LergInitializationError';
  }
}

export class LergUploadError extends LergFacadeError {
  constructor(message: string, public originalError?: Error) {
    super(`Upload error: ${message}`, originalError);
    this.name = 'LergUploadError';
  }
}

export class LergDataAccessError extends LergFacadeError {
  constructor(message: string, public originalError?: Error) {
    super(`Data access error: ${message}`, originalError);
    this.name = 'LergDataAccessError';
  }
}

export class LergClearDataError extends LergFacadeError {
  constructor(message: string, public originalError?: Error) {
    super(`Clear data error: ${message}`, originalError);
    this.name = 'LergClearDataError';
  }
}

/**
 * Error source to identify where an error originated
 */
export enum ErrorSource {
  API = 'api',
  DATABASE = 'database',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
}

/**
 * Extended error information
 */
export interface ErrorInfo {
  message: string;
  source: ErrorSource;
  timestamp: Date;
  originalError?: Error;
  details?: Record<string, any>;
}

/**
 * Operation status for LERG operations
 */
export enum OperationStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  IN_PROGRESS = 'in-progress',
  NOT_STARTED = 'not-started',
}

/**
 * Operation result interface
 */
export interface OperationResult<T = any> {
  status: OperationStatus;
  data?: T;
  error?: Error;
  errorInfo?: ErrorInfo;
  message?: string;
}

/**
 * LERG data statistics interface
 */
export interface LergStats {
  totalRecords: number;
  lastUpdated?: string;
  source: 'local' | 'server' | 'none';
}

/**
 * Log level enum for controlling log verbosity
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  operation: string;
  message: string;
  data?: any;
}

/**
 * LERG Facade Service
 *
 * This service acts as a facade between the API and database layers,
 * providing a simplified interface for LERG operations.
 */
class LergFacadeService {
  private static instance: LergFacadeService;
  private operationStatus: Map<string, OperationStatus> = new Map();
  private operationErrors: Map<string, ErrorInfo> = new Map();
  private logs: LogEntry[] = [];
  private logLevel: LogLevel = LogLevel.INFO; // Default log level

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize operation statuses
    this.resetOperationStatus('initialize');
    this.resetOperationStatus('upload');
    this.resetOperationStatus('clear');

    this.log(LogLevel.INFO, 'system', 'LergFacadeService initialized');
  }

  /**
   * Get the singleton instance of LergFacadeService
   * @returns The singleton instance
   */
  public static getInstance(): LergFacadeService {
    if (!LergFacadeService.instance) {
      LergFacadeService.instance = new LergFacadeService();
    }
    return LergFacadeService.instance;
  }

  /**
   * Set the log level
   * @param level The log level to set
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.log(LogLevel.INFO, 'system', `Log level set to ${LogLevel[level]}`);
  }

  /**
   * Get the current log level
   * @returns The current log level
   */
  public getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Get all logs
   * @param level Optional level to filter logs
   * @param operation Optional operation to filter logs
   * @returns Array of log entries
   */
  public getLogs(level?: LogLevel, operation?: string): LogEntry[] {
    let filteredLogs = this.logs;

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter((log) => log.level <= level);
    }

    if (operation) {
      filteredLogs = filteredLogs.filter((log) => log.operation === operation);
    }

    return filteredLogs;
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
    this.log(LogLevel.INFO, 'system', 'Logs cleared');
  }

  /**
   * Add a log entry
   * @param level The log level
   * @param operation The operation being performed
   * @param message The log message
   * @param data Optional data to include in the log
   */
  private log(level: LogLevel, operation: string, message: string, data?: any): void {
    // Only log if the level is less than or equal to the current log level
    if (level <= this.logLevel) {
      const entry: LogEntry = {
        timestamp: new Date(),
        level,
        operation,
        message,
        data,
      };

      this.logs.push(entry);

      // Also log to console for development
      const logPrefix = `[LERG][${LogLevel[level]}][${operation}]`;

      switch (level) {
        case LogLevel.ERROR:
          console.error(logPrefix, message, data || '');
          break;
        case LogLevel.WARN:
          console.warn(logPrefix, message, data || '');
          break;
        case LogLevel.INFO:
          console.info(logPrefix, message, data || '');
          break;
        case LogLevel.DEBUG:
        case LogLevel.TRACE:
          console.debug(logPrefix, message, data || '');
          break;
      }
    }
  }

  /**
   * Reset the status of a specific operation
   * @param operation The operation name
   */
  private resetOperationStatus(operation: string): void {
    this.operationStatus.set(operation, OperationStatus.NOT_STARTED);
    this.operationErrors.delete(operation);
    this.log(LogLevel.DEBUG, operation, 'Operation status reset');
  }

  /**
   * Set the status of a specific operation
   * @param operation The operation name
   * @param status The operation status
   * @param error Optional error if status is ERROR
   */
  private setOperationStatus(
    operation: string,
    status: OperationStatus,
    error?: Error,
    details?: Record<string, any>
  ): void {
    this.operationStatus.set(operation, status);

    this.log(
      status === OperationStatus.ERROR ? LogLevel.ERROR : LogLevel.INFO,
      operation,
      `Operation status changed to ${status}`,
      { status, details }
    );

    if (error && status === OperationStatus.ERROR) {
      // Determine error source
      let source = ErrorSource.UNKNOWN;

      if (
        error instanceof LergApiError ||
        error instanceof LergNetworkError ||
        error instanceof LergServerError
      ) {
        source = ErrorSource.API;
      } else if (error instanceof LergDataError || error instanceof LergConnectionError) {
        source = ErrorSource.DATABASE;
      } else if (error instanceof LergNetworkError) {
        source = ErrorSource.NETWORK;
      }

      // Create error info
      const errorInfo: ErrorInfo = {
        message: error.message,
        source,
        timestamp: new Date(),
        originalError: error,
        details,
      };

      this.operationErrors.set(operation, errorInfo);

      this.log(LogLevel.ERROR, operation, `Error occurred: ${error.message}`, {
        errorType: error.constructor.name,
        source,
        details,
      });
    } else {
      this.operationErrors.delete(operation);
    }
  }

  /**
   * Get the status of a specific operation
   * @param operation The operation name
   * @returns The operation status and error if any
   */
  public getOperationStatus(operation: string): {
    status: OperationStatus;
    errorInfo?: ErrorInfo;
  } {
    const status = this.operationStatus.get(operation) || OperationStatus.NOT_STARTED;
    const errorInfo = this.operationErrors.get(operation);

    this.log(LogLevel.DEBUG, operation, `Retrieved operation status: ${status}`, { errorInfo });

    return {
      status,
      errorInfo,
    };
  }

  /**
   * Create a specific error based on the operation and original error
   * @param operation The operation name
   * @param message The error message
   * @param originalError The original error
   * @returns A specific error type
   */
  private createSpecificError(
    operation: string,
    message: string,
    originalError?: Error
  ): LergFacadeError {
    let error: LergFacadeError;

    switch (operation) {
      case 'initialize':
        error = new LergInitializationError(message, originalError);
        break;
      case 'upload':
        error = new LergUploadError(message, originalError);
        break;
      case 'clear':
        error = new LergClearDataError(message, originalError);
        break;
      default:
        error = new LergFacadeError(message, originalError);
    }

    this.log(LogLevel.ERROR, operation, `Created specific error: ${error.name}`, {
      message,
      originalError: originalError?.message,
    });

    return error;
  }

  /**
   * Check if LERG data exists
   * @returns Promise resolving to data existence status
   */
  public async checkDataExists(): Promise<{
    exists: boolean;
    onServer: boolean;
    inStore: boolean;
    stats: { totalRecords: number; lastUpdated: string | null };
  }> {
    this.log(LogLevel.INFO, 'check', 'Checking if LERG data exists');

    const store = useLergStore();

    try {
      // Get API connection status
      let onServer = false;
      try {
        onServer = await lergApiService.testConnection();
        this.log(LogLevel.DEBUG, 'check', `Server connection available: ${onServer}`);
      } catch (error) {
        this.log(LogLevel.WARN, 'check', 'Error checking server connection:', error);
        onServer = false;
      }

      // Check store
      const inStore = store.stats?.totalRecords > 0;
      this.log(LogLevel.DEBUG, 'check', `Data in store: ${inStore}`);

      // Data exists if it's in either the store or on server
      const exists = inStore || onServer;

      const result = {
        exists,
        onServer,
        inStore,
        stats: {
          totalRecords: store.stats?.totalRecords || 0,
          lastUpdated: store.stats?.lastUpdated,
        },
      };

      this.log(LogLevel.INFO, 'check', 'Data check completed', result);
      return result;
    } catch (error) {
      this.log(LogLevel.ERROR, 'check', 'Error checking data existence', error);
      throw this.createSpecificError(
        'check',
        'Failed to check if LERG data exists',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Initialize LERG service and load data
   * @param forceRefresh Whether to force refreshing data from server
   * @returns Promise resolving to operation result
   */
  public async initialize(forceRefresh = false): Promise<OperationResult> {
    const operation = 'initialize';

    // Set operation status to in progress
    this.setOperationStatus(operation, OperationStatus.IN_PROGRESS);
    this.log(LogLevel.INFO, operation, 'Starting initialization', { forceRefresh });

    const store = useLergStore();

    try {
      store.isProcessing = true;
      store.error = '';

      // Reset store data if forcing refresh
      if (forceRefresh) {
        this.log(LogLevel.INFO, operation, 'Forcing refresh, clearing existing store data');
        store.clearLergData();
      }

      // Check if data already exists in the store
      if (store.stats.totalRecords > 0 && !forceRefresh) {
        this.log(LogLevel.INFO, operation, 'Data already exists in store, using cached data', {
          recordCount: store.stats.totalRecords,
        });

        this.setOperationStatus(operation, OperationStatus.SUCCESS);
        return {
          status: OperationStatus.SUCCESS,
          message: 'Using existing LERG data from store',
          data: {
            recordCount: store.stats.totalRecords,
            source: 'store',
          },
        };
      }

      // Get data from API
      this.log(LogLevel.INFO, operation, 'Fetching LERG data from API');
      const apiResult = await lergApiService.getLergData();

      if (!apiResult || !apiResult.records || apiResult.records.length === 0) {
        const error = new LergDataError('No LERG data returned from API');
        this.log(LogLevel.ERROR, operation, 'No LERG data returned from API');

        this.setOperationStatus(operation, OperationStatus.ERROR, error);

        store.error = error.message;
        store.isProcessing = false;

        return {
          status: OperationStatus.ERROR,
          error,
          errorInfo: this.operationErrors.get(operation),
          message: 'Failed to fetch LERG data from API',
        };
      }

      // Process the records and update the store
      this.log(LogLevel.INFO, operation, `Processing ${apiResult.records.length} LERG records`);
      this.processLergRecordsToStore(apiResult.records);
      store.setLergStats(apiResult.records.length);

      // Mark data as locally stored in memory (not indexedDB)
      store.setLergLocallyStored(true);

      this.log(LogLevel.INFO, operation, 'LERG data processed and stored in memory successfully', {
        recordCount: apiResult.records.length,
      });

      // Update operation status
      this.setOperationStatus(operation, OperationStatus.SUCCESS);

      return {
        status: OperationStatus.SUCCESS,
        message: 'LERG data initialized successfully',
        data: {
          recordCount: apiResult.records.length,
          source: 'api',
        },
      };
    } catch (error) {
      this.log(LogLevel.ERROR, operation, 'Initialization failed', error);

      // Create specific error with the original error
      const facadeError = this.createSpecificError(
        operation,
        'Failed to initialize LERG data',
        error instanceof Error ? error : undefined
      );

      // Set operation status
      this.setOperationStatus(operation, OperationStatus.ERROR, facadeError);

      // Update store error
      store.error = facadeError.message;

      return {
        status: OperationStatus.ERROR,
        error: facadeError,
        errorInfo: this.operationErrors.get(operation),
        message: facadeError.message,
      };
    } finally {
      store.isProcessing = false;
      this.log(LogLevel.DEBUG, operation, 'Reset processing state');
    }
  }

  /**
   * Process LERG records and update the store
   * @param records The LERG records to process
   */
  private processLergRecordsToStore(records: LERGRecord[]): void {
    // Process NPA-focused data structures
    const npaRecords = new Map<string, NpaRecord>();
    const countriesMap = new Map<string, Set<string>>();
    const countryStateMap = new Map<string, Map<string, Set<string>>>();

    // Create traditional state and country mappings for backward compatibility
    const stateNPAs: Record<string, string[]> = {};
    const countryData: Array<{
      country: string;
      npaCount: number;
      npas: string[];
      provinces?: Array<{ code: string; npas: string[] }>;
    }> = [];
    const countryNpaCounts: Record<string, Set<string>> = {};

    // Track Canadian provinces separately
    const canadaProvinces: Record<string, Set<string>> = {};

    // Fixed mappings for known issues
    const STATE_PROVINCE_FIXES: Record<string, { country: string; state: string }> = {
      MB: { country: 'CA', state: 'MB' }, // Manitoba is in Canada
      ON: { country: 'CA', state: 'ON' }, // Ontario is in Canada
      QC: { country: 'CA', state: 'QC' }, // Quebec is in Canada
      BC: { country: 'CA', state: 'BC' }, // British Columbia is in Canada
      AB: { country: 'CA', state: 'AB' }, // Alberta is in Canada
      SK: { country: 'CA', state: 'SK' }, // Saskatchewan is in Canada
      NS: { country: 'CA', state: 'NS' }, // Nova Scotia is in Canada
      NB: { country: 'CA', state: 'NB' }, // New Brunswick is in Canada
      NL: { country: 'CA', state: 'NL' }, // Newfoundland and Labrador is in Canada
      PE: { country: 'CA', state: 'PE' }, // Prince Edward Island is in Canada
      NT: { country: 'CA', state: 'NT' }, // Northwest Territories is in Canada
      YT: { country: 'CA', state: 'YT' }, // Yukon is in Canada
      NU: { country: 'CA', state: 'NU' }, // Nunavut is in Canada
    };

    // Process each record
    records.forEach((record) => {
      let { npa, state, country } = record;

      // Skip records without NPA
      if (!npa) return;

      // Apply fixes for known issues with state assignments
      if (state in STATE_PROVINCE_FIXES) {
        country = STATE_PROVINCE_FIXES[state].country;
        // Keep the state code as is, just ensure it's in the right country
      }

      // If state code exists in PROVINCE_CODES but not in STATE_CODES, ensure it's in CA
      if (state in PROVINCE_CODES && !(state in STATE_CODES)) {
        country = 'CA';
      }

      // Store in NPA records map
      npaRecords.set(npa, { npa, state, country });

      // Group by country
      if (!countriesMap.has(country)) {
        countriesMap.set(country, new Set<string>());
      }
      countriesMap.get(country)!.add(npa);

      // Group by country and state
      if (!countryStateMap.has(country)) {
        countryStateMap.set(country, new Map<string, Set<string>>());
      }

      const stateMap = countryStateMap.get(country)!;
      if (!stateMap.has(state)) {
        stateMap.set(state, new Set<string>());
      }

      stateMap.get(state)!.add(npa);

      // Traditional state mapping
      if (!stateNPAs[state]) {
        stateNPAs[state] = [];
      }
      if (!stateNPAs[state].includes(npa)) {
        stateNPAs[state].push(npa);
      }

      // Count NPAs by country
      if (!countryNpaCounts[country]) {
        countryNpaCounts[country] = new Set<string>();
      }
      countryNpaCounts[country].add(npa);

      // Track Canadian provinces
      if (country === 'CA') {
        if (!canadaProvinces[state]) {
          canadaProvinces[state] = new Set<string>();
        }
        canadaProvinces[state].add(npa);
      }
    });

    // Create country data array
    for (const [country, npas] of Object.entries(countryNpaCounts)) {
      const countryEntry = {
        country,
        npaCount: npas.size,
        npas: Array.from(npas),
      };

      // Add provinces data for Canada
      if (country === 'CA' && Object.keys(canadaProvinces).length > 0) {
        countryEntry.provinces = Object.entries(canadaProvinces).map(([code, npas]) => ({
          code,
          npas: Array.from(npas).sort(),
        }));
      }

      countryData.push(countryEntry);
    }

    // Update store with all data structures
    const store = useLergStore();
    store.setStateNPAs(stateNPAs);
    store.setCountryData(countryData);
    store.setNpaRecords(npaRecords);
    store.setCountriesMap(countriesMap);
    store.setCountryStateMap(countryStateMap);
  }

  /**
   * Upload a LERG file
   * @param file The file to upload
   * @param options Optional upload options including mappings and startLine
   * @returns Promise resolving to the operation result
   */
  public async uploadFile(
    file: File,
    options?: { mappings?: Record<string, string>; startLine?: number }
  ): Promise<OperationResult> {
    const operation = 'upload';

    // Set operation status to in progress
    this.setOperationStatus(operation, OperationStatus.IN_PROGRESS);
    this.log(LogLevel.INFO, operation, 'Starting file upload', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      options,
    });

    const store = useLergStore();

    try {
      store.isProcessing = true;
      store.error = '';

      // Validate file
      if (!file) {
        const error = new LergUploadError('No file provided for upload');
        this.log(LogLevel.ERROR, operation, 'No file provided for upload');

        this.setOperationStatus(operation, OperationStatus.ERROR, error, { fileProvided: false });

        store.error = error.message;
        store.isProcessing = false;

        return {
          status: OperationStatus.ERROR,
          error,
          errorInfo: this.operationErrors.get(operation),
          message: 'No file provided for upload',
        };
      }

      // Create form data
      this.log(LogLevel.DEBUG, operation, 'Creating form data');
      const formData = new FormData();
      formData.append('file', file);

      // Add mappings and startLine if provided
      if (options?.mappings) {
        formData.append('mappings', JSON.stringify(options.mappings));
        this.log(LogLevel.DEBUG, operation, 'Added mappings to form data', options.mappings);
      }

      if (options?.startLine !== undefined) {
        formData.append('startLine', options.startLine.toString());
        this.log(LogLevel.DEBUG, operation, 'Added startLine to form data', options.startLine);
      }

      // Upload file to server
      this.log(LogLevel.INFO, operation, 'Uploading file to server');
      const result = await lergApiService.uploadLergFile(formData);
      this.log(LogLevel.INFO, operation, 'File uploaded successfully', result);

      // Extract the processed records count from the result
      const processedRecords = result?.data?.processedRecords || 0;
      const totalRecords = result?.data?.totalRecords || 0;

      this.log(
        LogLevel.INFO,
        operation,
        `Processed ${processedRecords} out of ${totalRecords} records`
      );

      // Reset API cache
      this.log(LogLevel.DEBUG, operation, 'Clearing API cache');
      lergApiService.clearCache();

      // Re-initialize to get the new data
      this.log(LogLevel.INFO, operation, 'Re-initializing to get new data');
      await this.initialize(true);

      this.setOperationStatus(operation, OperationStatus.SUCCESS);

      const successResult = {
        status: OperationStatus.SUCCESS,
        message: 'LERG file uploaded and processed successfully',
        data: {
          count: processedRecords,
          totalRecords: totalRecords,
          ...result,
        },
      };

      this.log(LogLevel.INFO, operation, 'Upload completed successfully', successResult);

      return successResult;
    } catch (error) {
      this.log(LogLevel.ERROR, operation, 'File upload failed', error);

      // Create a specific error with the original error
      const facadeError = this.createSpecificError(
        operation,
        'Failed to upload LERG file',
        error instanceof Error ? error : undefined
      );

      // Set operation status to error with details
      this.setOperationStatus(operation, OperationStatus.ERROR, facadeError, {
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      });

      // Update store error
      store.error = facadeError.message;

      return {
        status: OperationStatus.ERROR,
        error: facadeError,
        errorInfo: this.operationErrors.get(operation),
        message: facadeError.message,
      };
    } finally {
      store.isProcessing = false;
      this.log(LogLevel.DEBUG, operation, 'Reset processing state');
    }
  }

  /**
   * Clear all LERG data (from store only, not using IndexedDB anymore)
   * @returns Promise resolving to the operation result
   */
  public async clearAllData(): Promise<OperationResult> {
    const operation = 'clear';

    // Set operation status to in progress
    this.setOperationStatus(operation, OperationStatus.IN_PROGRESS);
    this.log(LogLevel.INFO, operation, 'Starting to clear all LERG data');

    const store = useLergStore();

    try {
      store.isProcessing = true;
      store.error = '';

      // Clear data from the server if needed
      this.log(LogLevel.INFO, operation, 'Clearing data from server');
      await lergApiService.clearServerData();

      // Clear client-side data from store
      this.log(LogLevel.INFO, operation, 'Clearing client-side data from store');
      store.clearLergData();

      // Reset connection status
      this.log(LogLevel.INFO, operation, 'Reset connection status');

      // Clear cache
      this.log(LogLevel.DEBUG, operation, 'Clearing API cache');
      lergApiService.clearCache();

      this.setOperationStatus(operation, OperationStatus.SUCCESS);

      return {
        status: OperationStatus.SUCCESS,
        message: 'LERG data cleared successfully',
      };
    } catch (error) {
      this.log(LogLevel.ERROR, operation, 'Failed to clear LERG data', error);

      // Create a specific error with the original error
      const facadeError = this.createSpecificError(
        operation,
        'Failed to clear LERG data',
        error instanceof Error ? error : undefined
      );

      // Set operation status to error
      this.setOperationStatus(operation, OperationStatus.ERROR, facadeError);

      // Update store error
      store.error = facadeError.message;

      return {
        status: OperationStatus.ERROR,
        error: facadeError,
        errorInfo: this.operationErrors.get(operation),
        message: facadeError.message,
      };
    } finally {
      store.isProcessing = false;
    }
  }

  /**
   * Get processed LERG data
   * @returns Promise resolving to the processed data
   */
  public async getProcessedData(): Promise<
    OperationResult<{
      stateMapping: Record<string, any>;
      countryData: any[];
      count: number;
    }>
  > {
    const operation = 'getData';
    this.log(LogLevel.INFO, operation, 'Getting processed LERG data');

    try {
      const lergService = LergService.getInstance();
      const data = await lergService.getProcessedData();

      this.log(LogLevel.INFO, operation, `Retrieved processed data with ${data.count} records`);

      return {
        status: OperationStatus.SUCCESS,
        data,
      };
    } catch (error) {
      this.log(LogLevel.ERROR, operation, 'Failed to get processed LERG data', error);

      // Create a specific error with the original error
      const facadeError = new LergDataAccessError(
        'Failed to get processed LERG data',
        error instanceof Error ? error : undefined
      );

      // Set operation status to error with details
      this.setOperationStatus(operation, OperationStatus.ERROR, facadeError, {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      return {
        status: OperationStatus.ERROR,
        error: facadeError,
        errorInfo: this.operationErrors.get(operation),
        message: facadeError.message,
      };
    }
  }

  /**
   * Export logs to JSON format
   * @param level Optional level to filter logs
   * @param operation Optional operation to filter logs
   * @returns JSON string of logs
   */
  public exportLogs(level?: LogLevel, operation?: string): string {
    const logs = this.getLogs(level, operation);
    return JSON.stringify(logs, null, 2);
  }
}

// Export the singleton instance
export const lergFacadeService = LergFacadeService.getInstance();
