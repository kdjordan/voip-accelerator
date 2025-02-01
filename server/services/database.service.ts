import { Pool, PoolClient } from 'pg';

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool;

  private constructor() {
    console.log('Initializing database connection...'); // Debug log
    this.pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async query(text: string, params?: any[]) {
    console.log('Executing query:', text, params); // Debug log
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error); // Debug log
      throw error;
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async testConnection(): Promise<void> {
    try {
      await this.pool.query('SELECT 1');
      console.log('Database connection successful');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }
}
