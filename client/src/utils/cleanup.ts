import Dexie from 'dexie';
import { DBName, type DBNameType } from '@/types/app-types';

/**
 * Clears all known application IndexedDB databases.
 * Intended to be run on application startup to ensure a clean state.
 */
export async function clearApplicationDatabases(): Promise<void> {
  console.log('[Startup Cleanup] Starting database cleanup...');
  try {
    const dbNames = await Dexie.getDatabaseNames();
    console.log('[Startup Cleanup] Found existing databases:', dbNames);

    const knownDatabases = Object.values(DBName) as DBNameType[];
    console.log('[Startup Cleanup] Known application databases:', knownDatabases);

    // Filter for our application databases that actually exist
    const ourDbsToDelete = dbNames.filter((name) => knownDatabases.includes(name as DBNameType));
    console.log('[Startup Cleanup] Application databases to delete:', ourDbsToDelete);

    if (ourDbsToDelete.length === 0) {
      console.log('[Startup Cleanup] No application databases found to delete.');
      return;
    }

    // Delete each database
    const results = await Promise.allSettled(
      ourDbsToDelete.map(async (dbName) => {
        try {
          // Ensure no connections are lingering (though less likely on startup)
          const db = new Dexie(dbName);
          if (db.isOpen()) {
            console.warn(`[Startup Cleanup] Database ${dbName} was unexpectedly open. Closing.`);
            db.close(); // Dexie instances are singletons, close before delete
          }
          await Dexie.delete(dbName);
          console.log(`[Startup Cleanup] Deleted database ${dbName}`);
          return { dbName, status: 'fulfilled' };
        } catch (error) {
          console.error(`[Startup Cleanup] Failed to delete database ${dbName}:`, error);
          return { dbName, status: 'rejected', reason: error };
        }
      })
    );

    console.log('[Startup Cleanup] Cleanup finished. Results:', results);
  } catch (error) {
    console.error('[Startup Cleanup] Error during database cleanup process:', error);
    // Decide if we should throw or let the app continue potentially broken
    // For now, log the error and continue.
  }
}
