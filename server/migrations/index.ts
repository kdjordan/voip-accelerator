import { DatabaseService } from '@/services/database.service';

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
      console.info(`Running migration: ${file}`);
      const sql = await fs.promises.readFile(path.join(migrationsPath, file), 'utf-8');
      await db.query(sql);
    }
    console.info('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}
