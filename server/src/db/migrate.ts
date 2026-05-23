import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sql } from './client.js';

await migrate(db, { migrationsFolder: './src/db/migrations' });
await sql.end();
console.log('Migrations applied.');
