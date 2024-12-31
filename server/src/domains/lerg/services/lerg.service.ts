import { DatabaseService } from '../../shared/services/database.service';
import type { LERGStats, LERGRecord, LERGUploadResponse } from '../types/lerg.types';
import * as fs from 'fs';
import * as readline from 'readline';

export class LergService {
  private db: DatabaseService;
  private readonly batchSize = 1000;
  private processedNpanxx = new Set<string>();

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  async processLergFile(filePath: string): Promise<LERGUploadResponse> {
    let fileStream: fs.ReadStream | null = null;
    let rl: readline.Interface | null = null;

    try {
      // Get file stats first
      const stats = fs.statSync(filePath);
      console.log('File size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');

      // Initialize file reading
      fileStream = fs.createReadStream(filePath);
      rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      const { processedRecords, totalRecords } = await this.processFileContents(rl);

      return { processedRecords, totalRecords };
    } catch (error) {
      console.error('Error processing LERG file:', error);
      throw error;
    } finally {
      // Clean up resources
      if (rl) rl.close();
      if (fileStream) fileStream.destroy();
      this.processedNpanxx.clear();
    }
  }

  private async processFileContents(rl: readline.Interface): Promise<LERGUploadResponse> {
    let processedRecords = 0;
    let totalRecords = 0;
    let rawBatch: LERGRecord[] = [];

    for await (const line of rl) {
      totalRecords++;

      if (totalRecords % 100 === 0) {
        console.log(`Processing line ${totalRecords}`);
      }

      const record = this.parseLergLine(line);
      if (record) {
        console.log('Valid record found:', { npanxx: record.npanxx, state: record.state });
        rawBatch.push(record);

        if (rawBatch.length >= this.batchSize) {
          console.log('Raw batch collected:', rawBatch.length);
          const uniqueRecords = this.getUniqueBatch(rawBatch);
          console.log('Unique NPANXXs in this batch:', uniqueRecords.map(r => r.npanxx).join(', '));

          processedRecords += await this.processBatch(uniqueRecords);
          rawBatch = [];
        }
      } else {
        console.log('Invalid or skipped line:', line);
      }
    }

    if (rawBatch.length > 0) {
      const uniqueRecords = this.getUniqueBatch(rawBatch);
      processedRecords += await this.processBatch(uniqueRecords);
    }

    return { processedRecords, totalRecords };
  }

  private getUniqueBatch(records: LERGRecord[]): LERGRecord[] {
    const uniqueMap = new Map<string, LERGRecord>();

    for (const record of records) {
      const key = `${record.npa}${record.nxx}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, record);
      }
    }

    return Array.from(uniqueMap.values());
  }

  private async processBatch(batch: LERGRecord[]): Promise<number> {
    try {
      const inserted = await this.insertBatch(batch);
      console.log(`Processed batch: ${inserted} inserted out of ${batch.length} records`);
      return inserted;
    } catch (error) {
      console.error('Error processing batch:', error);
      return 0;
    }
  }

  private parseLergLine(line: string): LERGRecord | null {
    try {
      if (!line.trim()) {
        return null;
      }

      const parts = line.split(',').map(part => part.replace(/^"|"$/g, '').trim());

      // Skip header line
      if (parts[0].toUpperCase() === 'NPA') {
        return null;
      }

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
        console.log('Invalid state:', { state });
        return null;
      }

      return {
        npa,
        nxx,
        npanxx: `${npa}${nxx}`,
        state,
        last_updated: new Date(),
      };
    } catch (error) {
      console.error('Error parsing LERG line:', error);
      return null;
    }
  }

  private async insertBatch(records: LERGRecord[]) {
    console.log(
      'Attempting to insert records:',
      records.map(r => ({
        npanxx: r.npanxx,
        state: r.state,
      }))
    );

    const values = records.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(',');

    const query = `
      INSERT INTO lerg_codes 
      (npa, nxx, state, last_updated)
      VALUES ${values}
      ON CONFLICT (npanxx) DO NOTHING
      RETURNING npanxx;
    `;

    const params = records.flatMap(record => [record.npa, record.nxx, record.state, record.last_updated]);

    try {
      const result = await this.db.query(query, params);
      console.log(
        'Successfully inserted NPANXXs:',
        result.rows.map(r => r.npanxx)
      );
      return result.rowCount ?? 0;
    } catch (error) {
      console.error('Batch insert error:', error);
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
