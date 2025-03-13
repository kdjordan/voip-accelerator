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
  Object.keys(strategyCache).forEach(key => {
    delete strategyCache[key];
  });
}

/**
 * Monitor memory usage and switch to IndexedDB if threshold is exceeded
 * Only active if autoFallbackOnMemoryPressure is enabled in config
 */
export function setupMemoryMonitoring(): void {
  if (!storageConfig.autoFallbackOnMemoryPressure) return;
  
  const checkMemoryUsage = () => {
    if (storageConfig.storageType === 'indexeddb') return;
    
    // Check memory usage using performance API if available
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      const usedJSHeapSize = memoryInfo.usedJSHeapSize;
      const usedHeapSizeMB = usedJSHeapSize / (1024 * 1024);
      
      if (usedHeapSizeMB > storageConfig.memoryThresholdMB) {
        console.warn(`Memory usage (${usedHeapSizeMB.toFixed(2)}MB) exceeded threshold (${storageConfig.memoryThresholdMB}MB). Switching to IndexedDB storage.`);
        
        // Switch to IndexedDB storage
        storageConfig.storageType = 'indexeddb';
        
        // Could dispatch an event or notify the user here
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