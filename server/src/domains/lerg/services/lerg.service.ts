import { Pool, PoolClient } from 'pg';
import { LERGRecord, LERGUploadResponse } from '../types/lerg.types';
import { DatabaseService } from '../../../domains/shared/services/database.service';

export class LERGService {
  private dbService: DatabaseService;

  constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.dbService.query('SELECT 1');
      return true;
    } catch (error) {
      throw new Error('Database connection test failed');
    }
  }

  async getStats(): Promise<{ totalRecords: number; lastUpdated: string }> {
    try {
      const result = await this.dbService.query(`
        SELECT COUNT(*) as total, MAX(created_at) as last_updated 
        FROM lerg_codes
      `);
      return {
        totalRecords: parseInt(result.rows[0].total),
        lastUpdated: result.rows[0].last_updated,
      };
    } catch (error) {
      throw new Error('Failed to fetch LERG stats');
    }
  }

  async uploadLERGData(records: LERGRecord[]): Promise<LERGUploadResponse> {
    const response: LERGUploadResponse = {
      totalRecords: records.length,
      processedRecords: 0,
      failedRecords: 0,
      errors: [],
    };

    await this.dbService.transaction(async (client: PoolClient) => {
      for (const record of records) {
        try {
          await client.query(
            `INSERT INTO lerg_codes (npa, nxx, lata, ocn, company, state, rate_center, switch_clli)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (npa, nxx) DO UPDATE SET
             lata = $3, ocn = $4, company = $5, state = $6, rate_center = $7, switch_clli = $8`,
            [
              record.npa,
              record.nxx,
              record.lata,
              record.ocn,
              record.company,
              record.state,
              record.rate_center,
              record.switch_clli,
            ]
          );
          response.processedRecords++;
        } catch (error) {
          response.failedRecords++;
          response.errors?.push(
            `Error processing record ${record.npa}-${record.nxx}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }
    });

    return response;
  }
}
