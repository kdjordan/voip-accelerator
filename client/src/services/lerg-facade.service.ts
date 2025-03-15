import { LergService, LergDataError, LergConnectionError } from '@/services/lerg.service';
import { lergApiService, LergApiError, LergNetworkError, LergServerError, InitState } from '@/services/lerg-api.service';
import { useLergStore } from '@/stores/lerg-store';
import { useDBStore } from '@/stores/db-store';
import { DBName } from '@/types/app-types';

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
  UNKNOWN = 'unknown'
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
  NOT_STARTED = 'not-started'
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
  TRACE = 4
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
      filteredLogs = filteredLogs.filter(log => log.level <= level);
    }
    
    if (operation) {
      filteredLogs = filteredLogs.filter(log => log.operation === operation);
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
        data
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
      
      if (error instanceof LergApiError || error instanceof LergNetworkError || error instanceof LergServerError) {
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
        details
      };
      
      this.operationErrors.set(operation, errorInfo);
      
      this.log(LogLevel.ERROR, operation, `Error occurred: ${error.message}`, {
        errorType: error.constructor.name,
        source,
        details
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
      errorInfo
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
      originalError: originalError?.message
    });
    
    return error;
  }
  
  /**
   * Check if LERG data exists
   * @returns Promise resolving to an object indicating if data exists and where
   */
  public async checkDataExists(): Promise<{
    exists: boolean;
    inMemory: boolean;
    inIndexedDB: boolean;
    onServer: boolean;
    stats: LergStats;
  }> {
    const operation = 'checkDataExists';
    this.log(LogLevel.INFO, operation, 'Checking if LERG data exists');
    
    try {
      // Get services and stores
      const lergService = LergService.getInstance();
      const store = useLergStore();
      
      // Check local data
      this.log(LogLevel.DEBUG, operation, 'Checking for local data in IndexedDB');
      const hasLocalData = await lergService.hasData();
      let recordCount = 0;
      
      if (hasLocalData) {
        this.log(LogLevel.DEBUG, operation, 'Local data found, getting record count');
        recordCount = await lergService.getRecordCount();
        this.log(LogLevel.INFO, operation, `Found ${recordCount} records in IndexedDB`);
      } else {
        this.log(LogLevel.INFO, operation, 'No local data found in IndexedDB');
      }
      
      // Check server data
      this.log(LogLevel.DEBUG, operation, 'Testing connection to server');
      const hasServerData = await lergApiService.testConnection();
      this.log(LogLevel.INFO, operation, `Server data available: ${hasServerData}`);
      
      // Determine data source
      let source: 'local' | 'server' | 'none' = 'none';
      if (hasLocalData) {
        source = 'local';
      } else if (hasServerData) {
        source = 'server';
      }
      
      const result = {
        exists: hasLocalData || hasServerData,
        inMemory: store.isLocallyStored,
        inIndexedDB: hasLocalData,
        onServer: hasServerData,
        stats: {
          totalRecords: recordCount,
          lastUpdated: store.lastUpdated,
          source
        }
      };
      
      this.log(LogLevel.INFO, operation, 'Data existence check completed', result);
      
      return result;
    } catch (error) {
      this.log(LogLevel.ERROR, operation, 'Error checking LERG data existence', error);
      
      // Create a specific error
      const facadeError = new LergDataAccessError(
        'Failed to check LERG data existence',
        error instanceof Error ? error : undefined
      );
      
      // Set operation status
      this.setOperationStatus(
        operation,
        OperationStatus.ERROR,
        facadeError,
        { action: operation }
      );
      
      throw facadeError;
    }
  }
  
  /**
   * Initialize LERG data
   * This method coordinates between API and database layers to ensure data is available
   * @param forceRefresh Whether to force a refresh from the server
   * @returns Promise resolving to the operation result
   */
  public async initialize(forceRefresh = false): Promise<OperationResult> {
    const operation = 'initialize';
    
    // Set operation status to in progress
    this.setOperationStatus(operation, OperationStatus.IN_PROGRESS);
    this.log(LogLevel.INFO, operation, `Starting initialization${forceRefresh ? ' with force refresh' : ''}`);
    
    const store = useLergStore();
    const dbStore = useDBStore();
    
    try {
      store.isProcessing = true;
      store.error = '';
      
      // Get LergService instance
      const lergService = LergService.getInstance();
      
      // Check if data already exists in IndexedDB and we're not forcing a refresh
      this.log(LogLevel.DEBUG, operation, 'Checking for existing data in IndexedDB');
      const hasData = await lergService.hasData();
      this.log(LogLevel.INFO, operation, `IndexedDB has data: ${hasData}`);
      
      if (hasData && !forceRefresh) {
        this.log(LogLevel.INFO, operation, 'Loading data from IndexedDB');
        
        // Load data from IndexedDB
        const { stateMapping, countryData, count } = await lergService.getProcessedData();
        this.log(LogLevel.DEBUG, operation, `Loaded ${count} records from IndexedDB`);
        
        // Get the last updated timestamp from the database if possible
        let lastUpdated = null;
        try {
          const dbData = await lergService.getLastUpdatedTimestamp();
          lastUpdated = dbData?.lastUpdated;
          this.log(LogLevel.DEBUG, operation, `Database last updated: ${lastUpdated || 'unknown'}`);
        } catch (err) {
          this.log(LogLevel.WARN, operation, 'Could not get last updated timestamp from database', err);
        }
        
        // Update store with processed data
        this.log(LogLevel.DEBUG, operation, 'Updating store with processed data');
        store.setStateNPAs(stateMapping);
        store.setCountryData(countryData);
        store.setLergStats(count, lastUpdated);
        store.isLocallyStored = true;
        
        this.setOperationStatus(operation, OperationStatus.SUCCESS);
        
        const result = {
          status: OperationStatus.SUCCESS,
          message: 'LERG data loaded from local database',
          data: { count, source: 'local' }
        };
        
        this.log(LogLevel.INFO, operation, 'Initialization from local data completed successfully', result);
        
        return result;
      }
      
      // If we're forcing a refresh or don't have local data, close any existing connection
      this.log(LogLevel.DEBUG, operation, 'Closing any existing database connections');
      await dbStore.closeConnection(DBName.LERG);
      
      // Test connection to server
      this.log(LogLevel.DEBUG, operation, 'Testing connection to server');
      const hasServerData = await lergApiService.testConnection();
      this.log(LogLevel.INFO, operation, `Server data available: ${hasServerData}`);
      
      if (!hasServerData) {
        const error = new LergInitializationError('No LERG data available on server');
        this.log(LogLevel.ERROR, operation, 'No LERG data available on server');
        
        this.setOperationStatus(
          operation,
          OperationStatus.ERROR,
          error,
          { forceRefresh, hasLocalData: hasData }
        );
        
        store.error = error.message;
        store.isProcessing = false;
        
        return {
          status: OperationStatus.ERROR,
          error,
          errorInfo: this.operationErrors.get(operation),
          message: 'No LERG data available on server'
        };
      }
      
      // Fetch data from server
      this.log(LogLevel.INFO, operation, 'Fetching data from server');
      const lergData = await lergApiService.fetchLergData(forceRefresh);
      this.log(LogLevel.INFO, operation, `Received ${lergData.data?.length || 0} records from server`);
      
      if (!lergData.data || lergData.data.length === 0) {
        const error = new LergInitializationError('No LERG data received from server');
        this.log(LogLevel.ERROR, operation, 'No LERG data received from server');
        
        this.setOperationStatus(
          operation,
          OperationStatus.ERROR,
          error,
          { forceRefresh, hasLocalData: hasData, serverResponse: lergData }
        );
        
        store.error = error.message;
        store.isProcessing = false;
        
        return {
          status: OperationStatus.ERROR,
          error,
          errorInfo: this.operationErrors.get(operation),
          message: 'No LERG data received from server'
        };
      }
      
      // Initialize database with fetched data
      this.log(LogLevel.INFO, operation, 'Initializing database with fetched data');
      await lergService.initializeLergTable(lergData.data);
      
      // Process data for application use
      this.log(LogLevel.INFO, operation, 'Processing data for application use');
      const { stateMapping, countryData, count } = await lergService.getProcessedData();
      this.log(LogLevel.DEBUG, operation, `Processed ${count} records`);
      
      // Get the server's last updated timestamp
      const serverLastUpdated = lergData.stats?.lastUpdated;
      this.log(LogLevel.DEBUG, operation, `Server last updated: ${serverLastUpdated || 'unknown'}`);
      
      // Update store with processed data
      this.log(LogLevel.DEBUG, operation, 'Updating store with processed data');
      store.setStateNPAs(stateMapping);
      store.setCountryData(countryData);
      store.setLergStats(count, serverLastUpdated);
      store.isLocallyStored = count > 0;
      
      this.setOperationStatus(operation, OperationStatus.SUCCESS);
      
      const result = {
        status: OperationStatus.SUCCESS,
        message: 'LERG data initialized successfully from server',
        data: { count, source: 'server' }
      };
      
      this.log(LogLevel.INFO, operation, 'Initialization completed successfully', result);
      
      return result;
    } catch (error) {
      this.log(LogLevel.ERROR, operation, 'Initialization failed', error);
      
      // Create a specific error with the original error
      const facadeError = this.createSpecificError(
        operation,
        'Failed to initialize LERG data',
        error instanceof Error ? error : undefined
      );
      
      // Set operation status to error with details
      this.setOperationStatus(
        operation,
        OperationStatus.ERROR,
        facadeError,
        { 
          forceRefresh,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      );
      
      // Update store error
      store.error = facadeError.message;
      
      // Log specific error types for debugging
      if (error instanceof LergConnectionError) {
        this.log(LogLevel.ERROR, operation, 'Database connection error during initialization', error);
      } else if (error instanceof LergDataError) {
        this.log(LogLevel.ERROR, operation, 'Data processing error during initialization', error);
      } else if (error instanceof LergApiError) {
        this.log(LogLevel.ERROR, operation, 'API error during initialization', error);
      }
      
      return {
        status: OperationStatus.ERROR,
        error: facadeError,
        errorInfo: this.operationErrors.get(operation),
        message: facadeError.message
      };
    } finally {
      store.isProcessing = false;
      this.log(LogLevel.DEBUG, operation, 'Reset processing state');
    }
  }
  
  /**
   * Upload a LERG file
   * @param file The file to upload
   * @param options Optional upload options including mappings and startLine
   * @returns Promise resolving to the operation result
   */
  public async uploadFile(file: File, options?: { mappings?: Record<string, string>; startLine?: number }): Promise<OperationResult> {
    const operation = 'upload';
    
    // Set operation status to in progress
    this.setOperationStatus(operation, OperationStatus.IN_PROGRESS);
    this.log(LogLevel.INFO, operation, 'Starting file upload', { 
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      options
    });
    
    const store = useLergStore();
    
    try {
      store.isProcessing = true;
      store.error = '';
      
      // Validate file
      if (!file) {
        const error = new LergUploadError('No file provided for upload');
        this.log(LogLevel.ERROR, operation, 'No file provided for upload');
        
        this.setOperationStatus(
          operation,
          OperationStatus.ERROR,
          error,
          { fileProvided: false }
        );
        
        store.error = error.message;
        store.isProcessing = false;
        
        return {
          status: OperationStatus.ERROR,
          error,
          errorInfo: this.operationErrors.get(operation),
          message: 'No file provided for upload'
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
      
      this.log(LogLevel.INFO, operation, `Processed ${processedRecords} out of ${totalRecords} records`);
      
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
          ...result
        }
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
      this.setOperationStatus(
        operation,
        OperationStatus.ERROR,
        facadeError,
        { 
          fileName: file?.name,
          fileSize: file?.size,
          fileType: file?.type,
          errorType: error instanceof Error ? error.constructor.name : typeof error
        }
      );
      
      // Update store error
      store.error = facadeError.message;
      
      return {
        status: OperationStatus.ERROR,
        error: facadeError,
        errorInfo: this.operationErrors.get(operation),
        message: facadeError.message
      };
    } finally {
      store.isProcessing = false;
      this.log(LogLevel.DEBUG, operation, 'Reset processing state');
    }
  }
  
  /**
   * Clear all LERG data (server and client)
   * @returns Promise resolving to the operation result
   */
  public async clearAllData(): Promise<OperationResult> {
    const operation = 'clear';
    
    // Set operation status to in progress
    this.setOperationStatus(operation, OperationStatus.IN_PROGRESS);
    this.log(LogLevel.INFO, operation, 'Starting to clear all LERG data');
    
    const store = useLergStore();
    const dbStore = useDBStore();
    
    try {
      store.isProcessing = true;
      store.error = '';
      
      // First close any existing connections to prevent database being open
      this.log(LogLevel.DEBUG, operation, 'Closing any existing database connections');
      await dbStore.closeConnection(DBName.LERG);
      
      // Then clear data from the server
      this.log(LogLevel.INFO, operation, 'Clearing data from server');
      await lergApiService.clearServerData();
      
      // Then clear client-side data
      this.log(LogLevel.INFO, operation, 'Clearing client-side data');
      const lergService = LergService.getInstance();
      await lergService.clearLergData();
      
      // Clear cache
      this.log(LogLevel.DEBUG, operation, 'Clearing API cache');
      lergApiService.clearCache();
      
      // Reset store data
      this.log(LogLevel.DEBUG, operation, 'Resetting store data');
      store.setStateNPAs({});
      store.setCountryData([]);
      store.setLergStats(0);
      store.isLocallyStored = false;
      
      this.setOperationStatus(operation, OperationStatus.SUCCESS);
      
      const result = {
        status: OperationStatus.SUCCESS,
        message: 'LERG data cleared successfully'
      };
      
      this.log(LogLevel.INFO, operation, 'All LERG data cleared successfully');
      
      return result;
    } catch (error) {
      this.log(LogLevel.ERROR, operation, 'Failed to clear LERG data', error);
      
      // Create a specific error with the original error
      const facadeError = this.createSpecificError(
        operation,
        'Failed to clear LERG data',
        error instanceof Error ? error : undefined
      );
      
      // Set operation status to error with details
      this.setOperationStatus(
        operation,
        OperationStatus.ERROR,
        facadeError,
        { 
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      );
      
      // Update store error
      store.error = facadeError.message;
      
      return {
        status: OperationStatus.ERROR,
        error: facadeError,
        errorInfo: this.operationErrors.get(operation),
        message: facadeError.message
      };
    } finally {
      store.isProcessing = false;
      this.log(LogLevel.DEBUG, operation, 'Reset processing state');
    }
  }
  
  /**
   * Get processed LERG data
   * @returns Promise resolving to the processed data
   */
  public async getProcessedData(): Promise<OperationResult<{
    stateMapping: Record<string, any>;
    countryData: any[];
    count: number;
  }>> {
    const operation = 'getData';
    this.log(LogLevel.INFO, operation, 'Getting processed LERG data');
    
    try {
      const lergService = LergService.getInstance();
      const data = await lergService.getProcessedData();
      
      this.log(LogLevel.INFO, operation, `Retrieved processed data with ${data.count} records`);
      
      return {
        status: OperationStatus.SUCCESS,
        data
      };
    } catch (error) {
      this.log(LogLevel.ERROR, operation, 'Failed to get processed LERG data', error);
      
      // Create a specific error with the original error
      const facadeError = new LergDataAccessError(
        'Failed to get processed LERG data',
        error instanceof Error ? error : undefined
      );
      
      // Set operation status to error with details
      this.setOperationStatus(
        operation,
        OperationStatus.ERROR,
        facadeError,
        { 
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      );
      
      return {
        status: OperationStatus.ERROR,
        error: facadeError,
        errorInfo: this.operationErrors.get(operation),
        message: facadeError.message
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