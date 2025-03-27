/**
 * Storage Configuration
 *
 * This file provides configuration options for the application's storage strategy.
 * It allows toggling between in-memory storage (Pinia store) and IndexedDB (DexieJS) storage.
 */
import { reactive } from 'vue';

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
 * Using Vue's reactive to ensure changes trigger updates in components
 */
export const storageConfig = reactive<StorageConfig>({
  // Set to 'memory' to use Pinia store only - we're not using IndexedDB for LERG data
  storageType: 'memory',

  // Disabled - we don't want to fallback to IndexedDB for LERG data
  autoFallbackOnMemoryPressure: false,

  // Memory threshold in MB to trigger fallback
  memoryThresholdMB: 350,

  // Enable detailed logging of storage operations
  enableLogging: true,
});

/**
 * Updates the storage configuration at runtime
 * @param newConfig Partial configuration to update
 */
export function updateStorageConfig(newConfig: Partial<StorageConfig>): void {
  // Using Object.assign with reactive object will maintain reactivity
  Object.assign(storageConfig, newConfig);

  if (storageConfig.enableLogging) {
    console.log('[Storage Config] Updated configuration:', storageConfig);
  }

  // Trigger custom event to notify components of config changes
  window.dispatchEvent(
    new CustomEvent('storage-config-updated', {
      detail: { ...storageConfig },
    })
  );
}

/**
 * Switches to in-memory storage
 * @returns The updated config
 */
export function useMemoryStorage(): StorageConfig {
  // Update configuration to use memory
  updateStorageConfig({ storageType: 'memory' });

  // Dispatch event to notify of manual strategy change
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('storage-strategy-changed', {
      detail: { newType: 'memory', reason: 'user-requested' },
    });
    window.dispatchEvent(event);
  }

  return { ...storageConfig };
}

/**
 * Switches to IndexedDB storage
 * @returns The updated config
 */
export function useIndexedDbStorage(): StorageConfig {
  // Update configuration to use IndexedDB
  updateStorageConfig({ storageType: 'indexeddb' });

  // Dispatch event to notify of manual strategy change
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('storage-strategy-changed', {
      detail: { newType: 'indexeddb', reason: 'user-requested' },
    });
    window.dispatchEvent(event);
  }

  return { ...storageConfig };
}
