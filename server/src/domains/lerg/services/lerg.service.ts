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
        rl = readline.createInterface({
          input: require('stream').Readable.from(fileContent.toString()),
          crlfDelay: Infinity,
        });
      } else {
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
    try {
      console.log('Getting LERG stats...');
      const [lergStats, specialStats] = await Promise.all([
        this.db.query(`
          SELECT 
            COUNT(*) as total,
            MAX(last_updated) as last_updated 
          FROM lerg_codes
        `),
        this.getSpecialCodesStats(),
      ]);

      console.log('LERG stats query result:', lergStats.rows[0]);
      console.log('Special stats result:', specialStats);

      const stats = {
        totalRecords: parseInt(lergStats.rows[0].total || '0'),
        lastUpdated: lergStats.rows[0].last_updated || new Date(),
        specialCodes: specialStats,
      };

      console.log('Final stats object:', stats);
      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
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
    try {
      console.log('Getting special codes stats...');
      const [totalResult, breakdownResult] = await Promise.all([
        this.db.query('SELECT COUNT(*) as total FROM special_area_codes'),
        this.db.query(`
          SELECT country, COUNT(*) as count
          FROM special_area_codes
          GROUP BY country
          ORDER BY count DESC
        `),
      ]);

      console.log('Special codes total:', totalResult.rows[0]);
      console.log('Special codes breakdown:', breakdownResult.rows);

      return {
        totalCodes: parseInt(totalResult.rows[0].total || '0'),
        countryBreakdown: breakdownResult.rows.map(row => ({
          countryCode: row.country,
          count: parseInt(row.count),
        })),
      };
    } catch (error) {
      console.error('Error getting special codes stats:', error);
      return {
        totalCodes: 0,
        countryBreakdown: [],
      };
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

  public async reloadSpecialCodes(): Promise<void> {
    try {
      console.log('Starting special codes reload...');

      // Clear existing data
      await this.db.query('TRUNCATE TABLE special_area_codes;');

      // Read and process the CSV file
      const csvPath = path.resolve(__dirname, '../../../../data/special_codes.csv');
      console.log('Loading CSV from:', csvPath);

      const fileContent = await fs.promises.readFile(csvPath, 'utf-8');
      const records = fileContent
        .split('\n')
        .filter(line => line.trim())
        .slice(1) // Skip header
        .map(line => {
          const [npa, country, province] = line.split(',').map(field => field.trim());
          return {
            npa,
            country,
            description: province || null,
          };
        });

      console.log('CSV records:', {
        total: records.length,
        sample: records.slice(0, 3),
      });

      // Insert records in batches
      for (let i = 0; i < records.length; i += 100) {
        const batch = records.slice(i, i + 100);
        const values = batch.map(r => `('${r.npa}', '${r.country}', '${r.description}')`).join(',');

        const insertQuery = `
          INSERT INTO special_area_codes (npa, country, description)
          VALUES ${values}
          ON CONFLICT (npa) DO UPDATE SET
            country = EXCLUDED.country,
            description = EXCLUDED.description;
        `;
        await this.db.query(insertQuery);
      }

      // Verify data was inserted
      const verifyQuery = 'SELECT COUNT(*) FROM special_area_codes';
      const verifyResult = await this.db.query(verifyQuery);
      console.log('Verified inserted records:', verifyResult.rows[0].count);

      console.log('Special codes reload completed');
    } catch (error) {
      console.error('Error reloading special codes:', error);
      throw error;
    }
  }

  async reloadLergData(): Promise<void> {
    try {
      // Get the most recent LERG file from uploads directory
      const uploadsDir = path.resolve(__dirname, '../../../../uploads');
      const files = await fs.promises.readdir(uploadsDir);

      if (files.length === 0) {
        throw new Error('No LERG backup files found');
      }

      // Get the most recently modified file
      const filePaths = files.map(file => path.join(uploadsDir, file));
      const fileStats = await Promise.all(
        filePaths.map(async filePath => ({
          path: filePath,
          stat: await fs.promises.stat(filePath),
        }))
      );

      const mostRecentFile = fileStats.sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime())[0];

      if (!mostRecentFile) {
        throw new Error('No valid LERG backup files found');
      }

      // Process the file
      await this.processLergFile(mostRecentFile.path);
    } catch (error) {
      console.error('Error reloading LERG data:', error);
      throw error;
    }
  }

  public async getPublicSpecialCodes(): Promise<Array<{ npa: string; country: string; province: string }>> {
    try {
      // First check if table has data
      const countQuery = 'SELECT COUNT(*) FROM special_area_codes';
      const countResult = await this.db.query(countQuery);
      console.log('Database special codes count:', countResult.rows[0].count);

      const query = `
        SELECT npa, country, description as province
        FROM special_area_codes
        ORDER BY country, npa;
      `;
      const result = await this.db.query(query);
      console.log('Database query result:', {
        rowCount: result.rowCount,
        sampleData: result.rows.slice(0, 3),
      });
      return result.rows;
    } catch (error) {
      console.error('Error fetching special codes:', error);
      throw error;
    }
  }

  public async getPublicLergCodes(): Promise<Array<{ npanxx: string; npa: string; nxx: string; state: string }>> {
    try {
      const query = `
        SELECT npanxx, npa, nxx, state
        FROM lerg_codes
        ORDER BY npanxx
      `;
      const result = await this.db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching LERG codes:', error);
      throw error;
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      // First check if we can connect to the database
      await this.db.query('SELECT 1');

      // Then check if we have data in either table
      const result = await this.db.query(`
        SELECT EXISTS (
          SELECT 1 FROM lerg_codes LIMIT 1
        ) as has_lerg,
        EXISTS (
          SELECT 1 FROM special_area_codes LIMIT 1
        ) as has_special
      `);

      console.log('Database connection test results:', result.rows[0]);
      return result.rows[0].has_lerg || result.rows[0].has_special;
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw error;
    }
  }

  public async getSpecialCodesByCountry(country: string): Promise<Array<{ province: string; npas: string[] }>> {
    try {
      const query = `
        SELECT 
          description as province,
          array_agg(npa ORDER BY npa) as npas
        FROM special_area_codes
        WHERE country = $1
        GROUP BY description
        ORDER BY description
      `;

      console.log('Fetching special codes for country:', country);
      const result = await this.db.query(query, [country]);
      console.log('Special codes by country result:', result.rows);
      return result.rows;
    } catch (error) {
      console.error('Error fetching special codes by country:', error);
      throw error;
    }
  }
}
