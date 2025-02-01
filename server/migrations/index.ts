import { DatabaseService } from '../services/database.service';
import { logger } from '../config/logger';
import fs from 'fs';
import path from 'path';

export async function runMigrations() {
  const db = DatabaseService.getInstance();
  const migrationsPath = path.join(__dirname);

  try {
    // Read migration files in order
    const files = await fs.promises.readdir(migrationsPath);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      logger.info(`Running migration: ${file}`);
      const sql = await fs.promises.readFile(path.join(migrationsPath, file), 'utf-8');
      await db.query(sql);
    }
    logger.info('Migrations completed successfully');
  } catch (error) {
    logger.error('Migration error:', error);
    throw error;
  }
}
