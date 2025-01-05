import { DatabaseService } from '../domains/shared/services/database.service';
import path from 'path';
import fs from 'fs';

async function runMigrations() {
  const db = DatabaseService.getInstance();
  const migrationsPath = path.join(__dirname, '../domains/lerg/migrations');

  try {
    const files = await fs.promises.readdir(migrationsPath);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      console.log(`Running migration: ${file}`);
      const sql = await fs.promises.readFile(path.join(migrationsPath, file), 'utf-8');
      await db.query(sql);
    }
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
