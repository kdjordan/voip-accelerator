import { DatabaseService } from '../../shared/services/database.service';
import type { LERGStats, LERGRecord, LERGUploadResponse, SpecialCodesStats } from '../types/lerg.types';
import * as fs from 'fs';
import * as readline from 'readline';
import path from 'path';

export class LERGService {
  private db: DatabaseService;
  private readonly batchSize = 1000;
  private processedNpanxx = new Set<string>();

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  async processLergFile(fileContent: Buffer | string): Promise<LERGUploadResponse> {
    let fileStream: fs.ReadStream | null = null;
    let rl: readline.Interface | null = null;

    try {
      if (Buffer.isBuffer(fileContent)) {
        // Handle Buffer input
        rl = readline.createInterface({
          input: require('stream').Readable.from(fileContent.toString()),
          crlfDelay: Infinity,
        });
      } else {
        // Handle file path input (existing logic)
        const stats = fs.statSync(fileContent);
        console.log('File size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
        fileStream = fs.createReadStream(fileContent);
        rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity,
        });
      }

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
    const [lergStats, specialStats] = await Promise.all([
      this.db.query(`
        SELECT 
          COALESCE(COUNT(*), 0) as total,
          MAX(last_updated) as last_updated 
        FROM lerg_codes
      `),
      this.getSpecialCodesStats(),
    ]);

    return {
      totalRecords: parseInt(lergStats.rows[0].total),
      lastUpdated: lergStats.rows[0].last_updated,
      specialCodes: specialStats,
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

  private async getSpecialCodesStats(): Promise<SpecialCodesStats> {
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM special_area_codes
    `;

    const countryBreakdownQuery = `
      SELECT country, COUNT(*) as count
      FROM special_area_codes
      GROUP BY country
      ORDER BY count DESC
    `;

    try {
      const [totalResult, breakdownResult] = await Promise.all([
        this.db.query(totalQuery),
        this.db.query(countryBreakdownQuery),
      ]);

      return {
        totalCodes: parseInt(totalResult.rows[0].total),
        countryBreakdown: breakdownResult.rows.map(row => ({
          countryCode: row.country,
          count: parseInt(row.count),
        })),
      };
    } catch (error) {
      console.error('Error fetching special codes stats:', error);
      throw error;
    }
  }

  async clearLergData(): Promise<void> {
    const query = 'TRUNCATE TABLE lerg_codes';
    try {
      await this.db.query(query);
    } catch (error) {
      console.error('Error clearing LERG codes data:', error);
      throw error;
    }
  }

  async clearSpecialCodesData(): Promise<void> {
    const query = 'TRUNCATE TABLE special_area_codes';
    try {
      await this.db.query(query);
    } catch (error) {
      console.error('Error clearing special codes data:', error);
      throw error;
    }
  }

  async reloadSpecialCodes(): Promise<void> {
    try {
      // First clear existing data
      await this.clearSpecialCodesData();
      
      // Read and process the special codes CSV
      const specialCodesPath = path.resolve(__dirname, '../../../../data/special_codes.csv');
      const fileContent = await fs.promises.readFile(specialCodesPath, 'utf-8');
      
      // Process and insert the data
      const records = fileContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [npa, country, province] = line.split(',').map(field => field.trim());

          // Skip header row
          if (npa === 'NPA' || !npa || isNaN(Number(npa))) {
            return null;
          }

          return {
            npa,
            country,
            province_or_territory: province || 'N/A',
          };
        })
        .filter((record): record is { npa: string; country: string; province_or_territory: string } => record !== null);

      // Insert in batches
      for (let i = 0; i < records.length; i += this.batchSize) {
        const batch = records.slice(i, i + this.batchSize);
        await this.insertSpecialCodesBatch(batch);
      }
    } catch (error) {
      console.error('Error reloading special codes:', error);
      throw error;
    }
  }

  private async insertSpecialCodesBatch(records: { npa: string; country: string; province_or_territory: string }[]) {
    try {
      const values = records.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(',');
      const query = `
        INSERT INTO special_area_codes (npa, country, description)
        VALUES ${values}
        ON CONFLICT (npa) DO UPDATE SET
          country = EXCLUDED.country,
          description = EXCLUDED.description
      `;
      const params = records.flatMap(r => [r.npa, r.country, r.province_or_territory || null]);

      await this.db.query(query, params);
    } catch (error) {
      console.error('Error in insertSpecialCodesBatch:', error);
      throw error;
    }
  }

  async reloadLergData(): Promise<void> {
    // TODO: We need to implement this
    // We should either:
    // 1. Store the last successful LERG file somewhere
    // 2. Keep a backup of the last successful import
    // 3. Have a default LERG dataset for recovery
    throw new Error('LERG reload functionality not implemented yet');
  }
}
