import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sql } from './client.js';

// File-relative so this works from any cwd (dev runs from server/, the prod
// container runs from the repo root).
const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
await migrate(db, { migrationsFolder });
await sql.end();
console.log('Migrations applied.');
