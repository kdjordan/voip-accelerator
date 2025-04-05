/**
 * Storage Factory
 *
 * Now simplified to always use in-memory storage via StoreStrategy
 * after the removal of the optional storage functionality.
 */

import { StorageStrategy } from './storage-strategy';
import { StoreStrategy } from './store-strategy';
import { DBNameType } from '@/types/app-types';

/**
 * Get the appropriate storage strategy for the given database
 *
 * @param dbName The database name to get a strategy for
 * @returns Promise resolving to the appropriate strategy
 */
export async function getStorageStrategy<T>(dbName: DBNameType): Promise<StorageStrategy<T>> {
  console.log(`[StorageFactory] Creating memory storage strategy for ${dbName}`);
  // Always return StoreStrategy (memory) as the only option now
  return new StoreStrategy<T>(dbName);
}
