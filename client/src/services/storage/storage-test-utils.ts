/**
 * Storage Test Utilities
 * 
 * Provides utilities for testing and comparing storage strategies.
 * Can be used for both manual testing and automated tests.
 */

import { StorageStrategy } from './storage-strategy';
import { DBNameType } from '@/types/app-types';
import { getStorageStrategy } from './storage-factory';
import { storageConfig, updateStorageConfig } from '@/config/storage-config';

export interface PerformanceMetric {
  operation: string;
  strategy: 'memory' | 'indexeddb';
  recordCount: number;
  durationMs: number;
  bytesProcessed?: number;
}

/**
 * Run a performance test on a storage strategy
 * @param dbName The database name to use
 * @param dataGenerator A function that generates test data
 * @param recordCounts An array of record counts to test with
 * @returns Performance metrics for each operation and record count
 */
export async function runPerformanceTest<T>(
  dbName: DBNameType,
  dataGenerator: (count: number) => T[],
  recordCounts: number[] = [100, 1000, 10000]
): Promise<PerformanceMetric[]> {
  const metrics: PerformanceMetric[] = [];
  
  // Test both strategies
  for (const strategy of ['memory', 'indexeddb'] as const) {
    // Switch to the current strategy
    updateStorageConfig({ storageType: strategy });
    
    // Get the storage strategy
    const storage = await getStorageStrategy<T>(dbName);
    
    // Test each record count
    for (const count of recordCounts) {
      // Generate test data
      const data = dataGenerator(count);
      
      // Test write performance
      const writeMetric = await measureOperation(
        storage,
        'write',
        strategy,
        count,
        async () => {
          await storage.storeData(`test_${count}`, data);
        }
      );
      metrics.push(writeMetric);
      
      // Test read performance
      const readMetric = await measureOperation(
        storage,
        'read',
        strategy,
        count,
        async () => {
          await storage.getData(`test_${count}`);
        }
      );
      metrics.push(readMetric);
      
      // Test count performance
      const countMetric = await measureOperation(
        storage,
        'count',
        strategy,
        count,
        async () => {
          await storage.getCount(`test_${count}`);
        }
      );
      metrics.push(countMetric);
      
      // Clean up
      await storage.removeData(`test_${count}`);
    }
  }
  
  return metrics;
}

/**
 * Measure the performance of a storage operation
 */
async function measureOperation<T>(
  storage: StorageStrategy<T>,
  operation: string,
  strategy: 'memory' | 'indexeddb',
  recordCount: number,
  operationFn: () => Promise<any>
): Promise<PerformanceMetric> {
  // Record start time
  const startTime = performance.now();
  
  // Run the operation
  await operationFn();
  
  // Record end time
  const endTime = performance.now();
  
  // Calculate duration
  const durationMs = endTime - startTime;
  
  return {
    operation,
    strategy,
    recordCount,
    durationMs
  };
}

/**
 * Compare strategies side by side
 * @returns A string representation of the comparison
 */
export function compareStrategies(metrics: PerformanceMetric[]): string {
  let result = 'Strategy Comparison:\n';
  result += '===================\n\n';
  
  // Group by operation and record count
  const groups = new Map<string, PerformanceMetric[]>();
  
  for (const metric of metrics) {
    const key = `${metric.operation}_${metric.recordCount}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(metric);
  }
  
  // Print comparison for each group
  for (const [key, groupMetrics] of groups.entries()) {
    const [operation, countStr] = key.split('_');
    const count = parseInt(countStr);
    
    const memoryMetric = groupMetrics.find(m => m.strategy === 'memory');
    const indexeddbMetric = groupMetrics.find(m => m.strategy === 'indexeddb');
    
    if (memoryMetric && indexeddbMetric) {
      const speedup = indexeddbMetric.durationMs / memoryMetric.durationMs;
      
      result += `Operation: ${operation.toUpperCase()} | Records: ${count}\n`;
      result += `Memory: ${memoryMetric.durationMs.toFixed(2)}ms | IndexedDB: ${indexeddbMetric.durationMs.toFixed(2)}ms\n`;
      result += `Speedup: ${speedup.toFixed(2)}x (memory is ${speedup > 1 ? 'faster' : 'slower'})\n\n`;
    }
  }
  
  return result;
}

/**
 * Verify that both strategies produce the same results
 * @returns Whether the strategies are functionally equivalent
 */
export async function verifyStrategies<T>(
  dbName: DBNameType,
  dataGenerator: (count: number) => T[],
  recordCount: number = 100
): Promise<boolean> {
  try {
    // Generate test data
    const data = dataGenerator(recordCount);
    const tableName = 'verify_test';
    
    // Get the memory strategy
    updateStorageConfig({ storageType: 'memory' });
    const memoryStrategy = await getStorageStrategy<T>(dbName);
    
    // Get the indexeddb strategy
    updateStorageConfig({ storageType: 'indexeddb' });
    const indexeddbStrategy = await getStorageStrategy<T>(dbName);
    
    // Test write and read for both strategies
    await memoryStrategy.storeData(tableName, data);
    await indexeddbStrategy.storeData(tableName, data);
    
    const memoryData = await memoryStrategy.getData(tableName);
    const indexeddbData = await indexeddbStrategy.getData(tableName);
    
    // Clean up
    await memoryStrategy.removeData(tableName);
    await indexeddbStrategy.removeData(tableName);
    
    // Compare results
    if (!memoryData || !indexeddbData) {
      console.error('One of the strategies returned null data');
      return false;
    }
    
    if (memoryData.length !== indexeddbData.length) {
      console.error('Strategies returned different numbers of records', {
        memory: memoryData.length,
        indexeddb: indexeddbData.length
      });
      return false;
    }
    
    // Simple comparison of JSON stringified data
    // This may not work for complex objects with methods or circular references
    const memoryJson = JSON.stringify(memoryData);
    const indexeddbJson = JSON.stringify(indexeddbData);
    
    const isEqual = memoryJson === indexeddbJson;
    if (!isEqual) {
      console.error('Strategies returned different data');
    }
    
    return isEqual;
  } catch (error) {
    console.error('Error verifying strategies', error);
    return false;
  }
} 