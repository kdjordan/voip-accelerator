/**
 * Storage Configuration
 * 
 * This file provides configuration options for the application's storage strategy.
 * It allows toggling between in-memory storage (Pinia store) and IndexedDB (DexieJS) storage.
 */

export type StorageType = 'memory' | 'indexeddb';

export interface StorageConfig {
  /** Primary storage strategy to use */
  storageType: StorageType;
  
  /** Whether to fall back to IndexedDB if memory pressure is detected */
  autoFallbackOnMemoryPressure: boolean;
  
  /** Memory threshold in MB to trigger fallback (if enabled) */
  memoryThresholdMB: number;
  
  /** Whether to log storage operations for debugging */
  enableLogging: boolean;
}

/**
 * Default configuration settings for application storage
 */
export const storageConfig: StorageConfig = {
  // Set to 'memory' to use Pinia store, 'indexeddb' to use DexieJS
  storageType: 'memory',
  
  // If true, will automatically switch to indexeddb if memory usage exceeds threshold
  autoFallbackOnMemoryPressure: false,
  
  // Memory threshold in MB to trigger fallback
  memoryThresholdMB: 350,
  
  // Enable detailed logging of storage operations
  enableLogging: true
};

/**
 * Updates the storage configuration at runtime
 * @param newConfig Partial configuration to update
 */
export function updateStorageConfig(newConfig: Partial<StorageConfig>): void {
  Object.assign(storageConfig, newConfig);
  
  if (storageConfig.enableLogging) {
    console.log('[Storage Config] Updated configuration:', storageConfig);
  }
}

/**
 * Switches to in-memory storage
 * @returns The updated config
 */
export function useMemoryStorage(): StorageConfig {
  storageConfig.storageType = 'memory';
  if (storageConfig.enableLogging) {
    console.log('[Storage Config] Switched to in-memory storage');
  }
  return { ...storageConfig };
}

/**
 * Switches to IndexedDB storage
 * @returns The updated config
 */
export function useIndexedDbStorage(): StorageConfig {
  storageConfig.storageType = 'indexeddb';
  if (storageConfig.enableLogging) {
    console.log('[Storage Config] Switched to IndexedDB storage');
  }
  return { ...storageConfig };
} 