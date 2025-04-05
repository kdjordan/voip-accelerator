/**
 * Configuration for storage mechanisms used throughout the application
 * Determines whether to use local IndexedDB or in-memory storage for application data
 */
export const storageConfig = {
  /**
   * Storage type: 'indexed-db' or 'memory'
   * - 'indexed-db': Uses IndexedDB for data persistence
   * - 'memory': Uses in-memory storage (better for testing or small datasets)
   */
  storageType: 'indexed-db' as 'indexed-db' | 'memory',
};
