import { Pool } from 'pg';

const pool = new Pool({
  user: import.meta.env.VITE_DB_USER,
  host: import.meta.env.VITE_DB_HOST,
  database: import.meta.env.VITE_DB_NAME,
  password: import.meta.env.VITE_DB_PASSWORD,
  port: parseInt(import.meta.env.VITE_DB_PORT),
});

// Test the connection
pool.on('error', err => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
