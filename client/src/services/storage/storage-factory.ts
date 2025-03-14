/**
 * Storage Factory
 * 
 * Creates and returns the appropriate storage strategy based on configuration.
 * Acts as a central point for obtaining storage strategy instances.
 */

import { DBNameType } from '@/types/app-types';
import { StorageStrategy } from './storage-strategy';
import { storageConfig } from '@/config/storage-config';

// These will be lazy-loaded when needed
let DexieStrategy: any;
let StoreStrategy: any;

// Cache for strategy instances to avoid unnecessary instantiations
const strategyCache: Record<string, StorageStrategy<any>> = {};

/**
 * Gets the appropriate storage strategy based on configuration
 * 
 * @param type The database/store type (AZ or US)
 * @param forceType Optional parameter to override the configured storage type
 * @returns The storage strategy instance
 */
export async function getStorageStrategy<T>(
  type: DBNameType, 
  forceType?: 'memory' | 'indexeddb'
): Promise<StorageStrategy<T>> {
  
  const storageType = forceType || storageConfig.storageType;
  const cacheKey = `${type}-${storageType}`;
  
  // Return cached instance if available
  if (strategyCache[cacheKey]) {
    return strategyCache[cacheKey] as StorageStrategy<T>;
  }
  
  // Lazy-load the appropriate strategy implementation
  if (storageType === 'indexeddb') {
    if (!DexieStrategy) {
      const module = await import('./dexie-strategy');
      DexieStrategy = module.DexieStrategy;
    }
    
    const strategy = new DexieStrategy(type);
    await strategy.initialize();
    strategyCache[cacheKey] = strategy;
    return strategy;
  } else {
    if (!StoreStrategy) {
      const module = await import('./store-strategy');
      StoreStrategy = module.StoreStrategy;
    }
    
    const strategy = new StoreStrategy(type);
    await strategy.initialize();
    strategyCache[cacheKey] = strategy;
    return strategy;
  }
}

/**
 * Clears the strategy cache, forcing new instances to be created
 * Useful for testing or when configuration changes significantly
 */
export function clearStrategyCache(): void {
  console.log('[Storage Factory] Clearing strategy cache');
  Object.keys(strategyCache).forEach(key => {
    delete strategyCache[key];
  });
}

/**
 * Forces a complete refresh of all storage strategies
 * This should be called when switching storage types to ensure all services use the new strategy
 */
export async function forceRefreshStrategies(): Promise<void> {
  console.log('[Storage Factory] Forcing refresh of all strategies');
  
  // Clear the cache first
  clearStrategyCache();
  
  // Then force load new strategies for both AZ and US
  try {
    // Load AZ strategy
    const azStrategy = await getStorageStrategy('az');
    await azStrategy.initialize();
    console.log('[Storage Factory] Refreshed AZ strategy');
    
    // Load US strategy
    const usStrategy = await getStorageStrategy('us');
    await usStrategy.initialize();
    console.log('[Storage Factory] Refreshed US strategy');
  } catch (error) {
    console.error('[Storage Factory] Error refreshing strategies:', error);
    throw error;
  }
}

/**
 * Monitor memory usage and switch to IndexedDB if threshold is exceeded
 * Continually checks if autoFallbackOnMemoryPressure is enabled in config
 */
export function setupMemoryMonitoring(): void {
  // Always set up monitoring, but check the config flag when performing the check
  const checkMemoryUsage = () => {
    // Get current memory usage regardless of settings (for debugging)
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      const usedJSHeapSize = memoryInfo.usedJSHeapSize;
      const usedHeapSizeMB = usedJSHeapSize / (1024 * 1024);
      
      if (storageConfig.enableLogging) {
        console.debug(`[Memory Monitor] Current usage: ${usedHeapSizeMB.toFixed(2)}MB / Threshold: ${storageConfig.memoryThresholdMB}MB / Auto-fallback: ${storageConfig.autoFallbackOnMemoryPressure ? 'Enabled' : 'Disabled'}`);
      }
      
      // Skip the check if auto-fallback is disabled or already using IndexedDB
      if (!storageConfig.autoFallbackOnMemoryPressure || storageConfig.storageType === 'indexeddb') {
        return;
      }
      
      if (usedHeapSizeMB > storageConfig.memoryThresholdMB) {
        console.warn(`Memory usage (${usedHeapSizeMB.toFixed(2)}MB) exceeded threshold (${storageConfig.memoryThresholdMB}MB). Switching to IndexedDB storage.`);
        
        // Switch to IndexedDB storage
        storageConfig.storageType = 'indexeddb';
        
        // Dispatch an event to notify listeners
        const event = new CustomEvent('storage-strategy-changed', { 
          detail: { newType: 'indexeddb', reason: 'memory-pressure' } 
        });
        window.dispatchEvent(event);
      }
    }
  };
  
  // Check memory usage periodically
  setInterval(checkMemoryUsage, 30000);
} 