import { DatabaseService } from '../src/services/database.service';
import { logger } from '../src/config/logger';
import fs from 'fs';
import path from 'path';

export async function runMigrations() {
  const db = DatabaseService.getInstance();
  const migrationsPath = path.join(__dirname);

  try {
    // Reads SQL files in order (001_, 002_, etc.)
    const files = await fs.promises.readdir(migrationsPath);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    // Executes each migration in sequence
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
