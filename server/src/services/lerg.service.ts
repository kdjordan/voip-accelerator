import { DatabaseService } from '@/services/database.service';
import type { LERGRecord, LERGUploadResponse } from '@/types/lerg.types';
import * as fs from 'fs';
import * as readline from 'readline';
import path from 'path';
import { logger } from '@/config/logger';
import { LERGFileProcessor } from './lerg-file.processor';
import { SpecialCodesFileProcessor } from './special-codes-file.processor';

export class LERGService {
  private db: DatabaseService;
  private readonly batchSize = 1000;
  private processedNpanxx = new Set<string>();
  private fileProcessor: LERGFileProcessor;
  private specialCodesProcessor: SpecialCodesFileProcessor;

  constructor() {
    this.db = DatabaseService.getInstance();
    this.fileProcessor = new LERGFileProcessor();
    this.specialCodesProcessor = new SpecialCodesFileProcessor();
  }

  async processLergFile(fileContent: Buffer | string): Promise<LERGUploadResponse> {
    try {
      // First clear all existing LERG data
      await this.clearLergData();
      logger.info('Cleared existing LERG data');

      const records = await this.fileProcessor.processFile(fileContent);
      let processedRecords = 0;
      let totalRecords = records.length;

      // Process records in batches
      for (let i = 0; i < records.length; i += this.batchSize) {
        const batch = records.slice(i, i + this.batchSize);
        const uniqueRecords = this.getUniqueBatch(batch);
        processedRecords += await this.processBatch(uniqueRecords);
      }

      return { processedRecords, totalRecords };
    } catch (error) {
      logger.error('Error processing LERG file:', error);
      throw error;
    }
  }

  private async processFileContents(rl: readline.Interface): Promise<LERGUploadResponse> {
    let processedRecords = 0;
    let totalRecords = 0;
    let rawBatch: LERGRecord[] = [];

    for await (const line of rl) {
      totalRecords++;

      if (totalRecords % 100 === 0) {
        logger.debug(`Processing line ${totalRecords}`);
      }

      const record = this.parseLergLine(line);
      if (record) {
        logger.debug('Valid record found:', { npanxx: record.npanxx, state: record.state });
        rawBatch.push(record);

        if (rawBatch.length >= this.batchSize) {
          logger.debug('Raw batch collected:', { count: rawBatch.length });
          const uniqueRecords = this.getUniqueBatch(rawBatch);
          logger.debug('Unique NPANXXs in this batch:', { npanxxs: uniqueRecords.map(r => r.npanxx) });

          processedRecords += await this.processBatch(uniqueRecords);
          rawBatch = [];
        }
      } else {
        logger.debug('Invalid or skipped line:', { line });
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
      logger.info(`Processed batch: ${inserted} inserted out of ${batch.length} records`);
      return inserted;
    } catch (error) {
      logger.error('Error processing batch:', error);
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
      const country = parts[4];

      // Validate NPA and NXX
      if (!/^\d{3}$/.test(npa) || !/^\d{3}$/.test(nxx)) {
        logger.warn('Invalid NPA/NXX:', { npa, nxx });
        return null;
      }

      // Validate state is 2 characters
      if (!state || state.length !== 2) {
        logger.warn('Invalid state:', { state });
        return null;
      }

      return {
        npa,
        nxx,
        npanxx: `${npa}${nxx}`,
        state,
        country,
        last_updated: new Date(),
      };
    } catch (error) {
      logger.error('Error parsing LERG line:', error);
      return null;
    }
  }

  private async insertBatch(records: LERGRecord[]) {
    logger.debug('Attempting to insert records:', records);

    const values = records
      .map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`)
      .join(',');

    const params = records.flatMap(record => [
      record.npa,
      record.nxx,
      record.state,
      record.country,
      record.last_updated,
    ]);

    const query = `
      INSERT INTO lerg_codes
      (npa, nxx, state, country, last_updated)
      VALUES ${values}
      ON CONFLICT (npanxx) DO NOTHING
      RETURNING npanxx;
    `;

    try {
      const result = await this.db.query(query, params);
      logger.info(
        'Successfully inserted NPANXXs:',
        result.rows.map(r => r.npanxx)
      );
      return result.rowCount ?? 0;
    } catch (error) {
      logger.error('Batch insert error:', error);
      throw error;
    }
  }

  async getLergData() {
    const query = `
      SELECT json_build_object(
        'data', (
          SELECT json_agg(row_to_json(l)) 
          FROM (
            SELECT npanxx, npa, nxx, state 
            FROM lerg_codes 
            ORDER BY npanxx
            LIMIT 100000
          ) l
        ),
        'stats', json_build_object(
          'totalRecords', (SELECT COUNT(*) FROM lerg_codes),
          'lastUpdated', (SELECT MAX(last_updated) FROM lerg_codes)
        )
      ) as result
    `;
    const result = await this.db.query(query);
    return result.rows[0].result;
  }

  async getSpecialCodesData() {
    const query = `
      WITH country_breakdown AS (
        SELECT 
          country as countryCode,
          COUNT(*) as count,
          array_agg(npa) as npaCodes
        FROM special_area_codes
        GROUP BY country
      )
      SELECT json_build_object(
        'data', (
          SELECT json_agg(row_to_json(s)) 
          FROM (
            SELECT npa, country, province, last_updated
            FROM special_area_codes
          ) s
        ),
        'stats', json_build_object(
          'totalCodes', (SELECT COUNT(*) FROM special_area_codes),
          'lastUpdated', (SELECT MAX(last_updated) FROM special_area_codes),
          'countryBreakdown', (
            SELECT json_agg(row_to_json(cb))
            FROM country_breakdown cb
          )
        )
      ) as result`;

    const result = await this.db.query(query);
    return result.rows[0].result;
  }

  async clearAllData(): Promise<void> {
    const query = 'TRUNCATE TABLE lerg_codes';
    try {
      await this.db.query(query);
    } catch (error) {
      logger.error('Error clearing LERG data:', error);
      throw error;
    }
  }

  async clearLergData(): Promise<void> {
    const query = 'TRUNCATE TABLE lerg_codes';
    try {
      await this.db.query(query);
    } catch (error) {
      logger.error('Error clearing LERG codes data:', error);
      throw error;
    }
  }

  async clearSpecialCodesData(): Promise<void> {
    const query = 'TRUNCATE TABLE special_area_codes';
    try {
      await this.db.query(query);
    } catch (error) {
      logger.error('Error clearing special codes data:', error);
      throw error;
    }
  }

  async processSpecialCodesFile(fileBuffer: Buffer): Promise<void> {
    try {
      logger.info('Processing special codes file...');

      // Parse the file
      const records = await this.specialCodesProcessor.processFile(fileBuffer);

      // Clear existing data
      await this.db.query('TRUNCATE TABLE special_area_codes;');

      // Process records in batches
      for (let i = 0; i < records.length; i += 100) {
        const batch = records.slice(i, i + 100);
        const values = batch
          .map(
            record =>
              `('${record.npa}', '${record.country}', ${record.province ? `'${record.province}'` : 'NULL'}, NOW())`
          )
          .join(',');

        const insertQuery = `
          INSERT INTO special_area_codes (npa, country, province, last_updated)
          VALUES ${values}
          ON CONFLICT ON CONSTRAINT special_area_codes_pkey DO UPDATE SET
            country = EXCLUDED.country,
            province = EXCLUDED.province,
            last_updated = EXCLUDED.last_updated;
        `;

        await this.db.query(insertQuery);
      }

      logger.info('Special codes file processed successfully');
    } catch (error) {
      logger.error('Failed to process special codes file:', error);
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
      logger.error('Error reloading LERG data:', error);
      throw error;
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.db.query('SELECT 1');
      const result = await this.db.query(`
        SELECT EXISTS (
          SELECT 1 FROM lerg_codes LIMIT 1
        ) as has_lerg,
        EXISTS (
          SELECT 1 FROM special_area_codes LIMIT 1
        ) as has_special
      `);

      logger.info('[lerg.service.ts] Connection test results:', result.rows[0]);
      return result.rows[0].has_lerg || result.rows[0].has_special;
    } catch (error) {
      logger.error('[lerg.service.ts] Database connection test failed:', error);
      throw error;
    }
  }

  public async getSpecialCodesByCountry(country: string): Promise<Array<{ province: string; npas: string[] }>> {
    try {
      const query = `
        SELECT 
          province,
          array_agg(npa ORDER BY npa) as npas
        FROM special_area_codes
        WHERE country = $1
        GROUP BY province
        ORDER BY province
      `;
      const result = await this.db.query(query, [country]);
      return result.rows;
    } catch (error) {
      logger.error('[lerg.service.ts] Error fetching special codes by country:', error);
      throw error;
    }
  }
}
