import Dexie from 'dexie';
import { DBConfig } from '@/config/database';

/**
 * Cleanup all application databases on exit
 */
export async function cleanupDatabases(): Promise<void> {
  try {
    // Get all databases
    const dbNames = await Dexie.getDatabaseNames();
    console.log('Found databases:', dbNames);

    // Define known database patterns
    const knownPatterns = [
      DBConfig.LERG.name,
      'lerg_db', // Backup check
      'lerg', // Another possible name
      '_db$', // Sample databases ending with _db
      'az_rate_deck_db',
      'az'
    ];

    // Filter for our application databases only
    const ourDbs = dbNames.filter(name => {
      const matches = knownPatterns.some(pattern => {
        if (pattern.endsWith('$')) {
          // Handle regex pattern
          return name.match(new RegExp(pattern));
        }
        return name === pattern;
      });
      console.log(`Checking ${name}:`, { matches });
      return matches;
    });

    console.log('Databases to clean:', ourDbs);

    // Delete each database
    const results = await Promise.allSettled(
      ourDbs.map(async dbName => {
        try {
          // Force close any open connections
          const db = new Dexie(dbName);
          await db.close();
          await Dexie.delete(dbName);
          console.log(`Deleted database ${dbName}`);
          return { dbName, success: true };
        } catch (error) {
          console.warn(`Failed to delete database ${dbName}:`, error);
          return { dbName, success: false, error };
        }
      })
    );

    console.log('Cleanup results:', results);
  } catch (error) {
    // Log but don't throw - we don't want to block page unload
    console.warn('Error during database cleanup:', error);
  }
}
