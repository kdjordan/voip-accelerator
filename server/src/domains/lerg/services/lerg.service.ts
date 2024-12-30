import { DatabaseService } from '../../shared/services/database.service';
import type { LERGStats, LERGRecord, LERGUploadResponse } from '../types/lerg.types';
import * as fs from 'fs';
import * as readline from 'readline';

export class LergService {
  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  async processLergFile(filePath: string): Promise<LERGUploadResponse> {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let processedRecords = 0;
    let totalRecords = 0;
    const batchSize = 1000;
    let batch: LERGRecord[] = [];

    try {
      for await (const line of rl) {
        totalRecords++;
        const record = this.parseLergLine(line);
        if (record) {
          batch.push(record);
          if (batch.length >= batchSize) {
            await this.insertBatch(batch);
            processedRecords += batch.length;
            batch = [];
          }
        }
      }

      if (batch.length > 0) {
        await this.insertBatch(batch);
        processedRecords += batch.length;
      }

      return { processedRecords, totalRecords };
    } catch (error) {
      console.error('Error processing LERG file:', error);
      throw error;
    } finally {
      fileStream.close();
    }
  }

  private parseLergLine(line: string): LERGRecord | null {
    try {
      console.log('Parsing line:', line);

      // Split the line by commas, but respect quotes
      const parts = line.split(',').map(part => part.replace(/"/g, '').trim());

      // Based on the file format:
      // parts[0] = NPA
      // parts[1] = NXX
      // parts[3] = State

      const npa = parts[0];
      const nxx = parts[1];
      const state = parts[3];

      // Validate NPA and NXX
      if (!/^\d{3}$/.test(npa) || !/^\d{3}$/.test(nxx)) {
        console.log('Invalid NPA/NXX:', { npa, nxx });
        return null;
      }

      // Validate state is 2 characters
      if (!state || state.length !== 2) {
        console.log('Invalid state:', state);
        return null;
      }

      const record = {
        npa,
        nxx,
        state,
        last_updated: new Date(),
      };

      console.log('Parsed record:', record);
      return record;
    } catch (error) {
      console.error('Error parsing LERG line:', error);
      return null;
    }
  }

  private async insertBatch(records: LERGRecord[]) {
    const query = `
      INSERT INTO lerg_codes 
      (npa, nxx, state, last_updated)
      VALUES 
      ($1, $2, $3, $4)
    `;

    let skippedRecords = 0;

    try {
      await this.db.query('BEGIN');
      for (const record of records) {
        try {
          await this.db.query(query, [record.npa, record.nxx, record.state, record.last_updated]);
        } catch (error: unknown) {
          if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
            console.log(`Skipping duplicate NPANXX for NPA: ${record.npa} and NXX: ${record.nxx}`);
            skippedRecords++;
            continue; // Skip this record and continue with the next
          }
          throw error; // Re-throw other errors
        }
      }
      await this.db.query('COMMIT');
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }
  }

  async getStats(): Promise<LERGStats> {
    const query = `
      SELECT 
        COALESCE(COUNT(*), 0) as total,
        MAX(last_updated) as last_updated 
      FROM lerg_codes
    `;
    const result = await this.db.query(query);
    return {
      totalRecords: parseInt(result.rows[0].total),
      lastUpdated: result.rows[0].last_updated,
    };
  }

  async clearAllData(): Promise<void> {
    const query = 'TRUNCATE TABLE lerg_codes';
    try {
      await this.db.query(query);
    } catch (error) {
      console.error('Error clearing LERG data:', error);
      throw error;
    }
  }
}
