import { LergService, LergDataError, LergConnectionError } from '@/services/lerg.service';
import { useLergStore } from '@/stores/lerg-store';
import { useDBStore } from '@/stores/db-store';
import { DBName } from '@/types/app-types';

/**
 * API endpoints for LERG service
 */
const API_BASE = '/api';
const PUBLIC_URL = `${API_BASE}/lerg`;
const ADMIN_URL = `${API_BASE}/admin/lerg`;

/**
 * Custom error types for LERG API service operations
 */
export class LergApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'LergApiError';
  }
}

export class LergNetworkError extends LergApiError {
  constructor(message: string, public originalError?: Error) {
    super(`LERG network error: ${message}`);
    this.name = 'LergNetworkError';
  }
}

export class LergServerError extends LergApiError {
  constructor(message: string, status: number) {
    super(`LERG server error (${status}): ${message}`, status);
    this.name = 'LergServerError';
  }
}

/**
 * Initialization states for the LERG service
 */
export enum InitState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Current initialization state
let initState: InitState = InitState.IDLE;
let initError: Error | null = null;

// Cache for API responses
const apiCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

/**
 * LERG API Service
 * Responsible for communication with the LERG API
 */
export const lergApiService = {
  /**
   * Get the current initialization state
   * @returns The current initialization state
   */
  getInitState(): { state: InitState; error: Error | null } {
    return {
      state: initState,
      error: initError
    };
  },

  /**
   * Reset the initialization state
   */
  resetInitState(): void {
    initState = InitState.IDLE;
    initError = null;
  },

  /**
   * Clear the API cache
   * @param endpoint Optional specific endpoint to clear, or all if not specified
   */
  clearCache(endpoint?: string): void {
    if (endpoint) {
      apiCache.delete(endpoint);
      console.log(`Cleared cache for endpoint: ${endpoint}`);
    } else {
      apiCache.clear();
      console.log('Cleared all API cache');
    }
  },

  /**
   * Make an API request with caching and error handling
   * @param url The URL to request
   * @param options Fetch options
   * @param useCache Whether to use and update the cache
   * @returns The response data
   */
  async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    useCache = true
  ): Promise<T> {
    // Check cache first if GET request and caching is enabled
    const isGetRequest = !options.method || options.method === 'GET';
    if (useCache && isGetRequest && apiCache.has(url)) {
      const cachedData = apiCache.get(url)!;
      const now = Date.now();
      if (now - cachedData.timestamp < CACHE_EXPIRATION_MS) {
        console.log(`Using cached response for ${url}`);
        return cachedData.data as T;
      } else {
        // Cache expired
        apiCache.delete(url);
      }
    }

    try {
      const response = await fetch(url, options);
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new LergServerError(errorText, response.status);
      }
      
      // Parse JSON response
      const data = await response.json();
      
      // Cache the response if it's a GET request and caching is enabled
      if (useCache && isGetRequest) {
        apiCache.set(url, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data as T;
    } catch (error) {
      // Handle network errors vs server errors
      if (error instanceof LergServerError) {
        throw error;
      } else {
        const networkError = error instanceof Error ? error : new Error(String(error));
        throw new LergNetworkError('Request failed', networkError);
      }
    }
  },

  /**
   * Test connection to the LERG API
   * @returns Promise resolving to true if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.makeRequest<boolean>(`${PUBLIC_URL}/test-connection`);
    } catch (error) {
      console.error('Failed to test connection to LERG service:', error);
      return false;
    }
  },

  /**
   * Fetch LERG data from the server
   * @param forceRefresh Force a refresh of the cache
   * @returns Promise resolving to LERG data
   */
  async fetchLergData(forceRefresh = false): Promise<{
    data: any[];
    stats: { totalRecords: number; lastUpdated?: string };
  }> {
    try {
      return await this.makeRequest<{
        data: any[];
        stats: { totalRecords: number; lastUpdated?: string };
      }>(`${PUBLIC_URL}/lerg-data`, {}, !forceRefresh);
    } catch (error) {
      console.error('Failed to fetch LERG data:', error);
      return { data: [], stats: { totalRecords: 0 } };
    }
  },

  /**
   * Upload a LERG file to the server
   * @param formData The form data containing the file
   * @returns Promise resolving to the upload result
   */
  async uploadLergFile(formData: FormData): Promise<any> {
    try {
      const result = await this.makeRequest<any>(`${ADMIN_URL}/upload`, {
        method: 'POST',
        body: formData,
      }, false);
      
      // Clear cache after successful upload
      this.clearCache();
      
      return result;
    } catch (error) {
      if (error instanceof LergServerError) {
        throw new LergApiError(`Failed to upload LERG file: ${error.message}`);
      } else if (error instanceof LergNetworkError) {
        throw new LergApiError('Network error while uploading LERG file');
      } else {
        throw new LergApiError('Unknown error while uploading LERG file');
      }
    }
  },

  /**
   * Clear LERG data on the server
   * @returns Promise resolving when data is cleared
   */
  async clearServerData(): Promise<void> {
    try {
      await this.makeRequest<void>(`${ADMIN_URL}/clear`, {
        method: 'DELETE'
      }, false);
      
      // Clear cache after successful clear
      this.clearCache();
      
      console.log('LERG data cleared on server successfully');
    } catch (error) {
      if (error instanceof LergServerError) {
        throw new LergApiError(`Failed to clear LERG data on server: ${error.message}`);
      } else if (error instanceof LergNetworkError) {
        throw new LergApiError('Network error while clearing LERG data');
      } else {
        throw new LergApiError('Unknown error while clearing LERG data');
      }
    }
  },

  /**
   * @deprecated Use lergFacadeService.initialize() instead
   * Initialize the LERG service
   * This method is kept for backward compatibility
   * In the future, this should be moved to the facade service
   */
  async initialize(): Promise<void> {
    console.warn('LergApiService.initialize() is deprecated. Use lergFacadeService.initialize() instead.');
    
    // Import dynamically to avoid circular dependencies
    const { lergFacadeService } = await import('@/services/lerg-facade.service');
    await lergFacadeService.initialize();
  },

  /**
   * @deprecated Use lergFacadeService.clearAllData() instead
   * Clear all LERG data (server and client)
   * This method is kept for backward compatibility
   * In the future, this should be moved to the facade service
   */
  async clearAllData(): Promise<void> {
    console.warn('LergApiService.clearAllData() is deprecated. Use lergFacadeService.clearAllData() instead.');
    
    // Import dynamically to avoid circular dependencies
    const { lergFacadeService } = await import('@/services/lerg-facade.service');
    await lergFacadeService.clearAllData();
  }
};
