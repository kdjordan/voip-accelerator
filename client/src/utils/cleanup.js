import Dexie from 'dexie';
import { DBName } from '@/types/app-types';
/**
 * Cleanup all application databases on exit
 */
export async function cleanupDatabases() {
    try {
        // Get all databases
        const dbNames = await Dexie.getDatabaseNames();
        console.log('Found databases:', dbNames);
        // Get all our known DB names from the DBName constant
        const knownDatabases = Object.values(DBName);
        console.log('Known databases:', knownDatabases);
        // Filter for our application databases only
        const ourDbs = dbNames.filter(name => knownDatabases.includes(name));
        console.log('Databases to clean:', ourDbs);
        // Delete each database
        const results = await Promise.allSettled(ourDbs.map(async (dbName) => {
            try {
                // Force close any open connections
                const db = new Dexie(dbName);
                await db.close();
                await Dexie.delete(dbName);
                console.log(`Deleted database ${dbName}`);
                return { dbName, success: true };
            }
            catch (error) {
                console.warn(`Failed to delete database ${dbName}:`, error);
                return { dbName, success: false, error };
            }
        }));
        console.log('Cleanup results:', results);
    }
    catch (error) {
        // Log but don't throw - we don't want to block page unload
        console.warn('Error during database cleanup:', error);
    }
}
