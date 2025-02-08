import { DatabaseService } from '@/services/database.service';
import type { LERGRecord, LERGUploadResponse } from '@/types/lerg.types';
import * as fs from 'fs';
import * as readline from 'readline';
import path from 'path';
import { logger } from '@/config/logger';
import { LERGFileProcessor } from './lerg-file.processor';

export class LERGService {
  private db: DatabaseService;
  private readonly batchSize = 1000;
  private fileProcessor: LERGFileProcessor;

  constructor() {
    this.db = DatabaseService.getInstance();
    this.fileProcessor = new LERGFileProcessor();
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
        logger.debug('Unique NPAs in this batch:', { npas: uniqueRecords.map(r => r.npa) });
        processedRecords += await this.processBatch(uniqueRecords);
      }

      return { processedRecords, totalRecords };
    } catch (error) {
      logger.error('Error processing LERG file:', error);
      throw error;
    }
  }

  // private async processFileContents(rl: readline.Interface): Promise<LERGUploadResponse> {
  //   let processedRecords = 0;
  //   let totalRecords = 0;
  //   let rawBatch: LERGRecord[] = [];

  //   for await (const line of rl) {
  //     totalRecords++;

  //     if (totalRecords % 100 === 0) {
  //       logger.debug(`Processing line ${totalRecords}`);
  //     }

  //     const record = this.parseLergLine(line);
  //     if (record) {
  //       logger.debug('Valid record found:', { npanxx: record.npanxx, state: record.state });
  //       rawBatch.push(record);

  //       if (rawBatch.length >= this.batchSize) {
  //         logger.debug('Raw batch collected:', { count: rawBatch.length });
  //         const uniqueRecords = this.getUniqueBatch(rawBatch);
  //         logger.debug('Unique NPANXXs in this batch:', { npanxxs: uniqueRecords.map(r => r.npanxx) });

  //         processedRecords += await this.processBatch(uniqueRecords);
  //         rawBatch = [];
  //       }
  //     } else {
  //       logger.debug('Invalid or skipped line:', { line });
  //     }
  //   }

  //   if (rawBatch.length > 0) {
  //     const uniqueRecords = this.getUniqueBatch(rawBatch);
  //     processedRecords += await this.processBatch(uniqueRecords);
  //   }

  //   return { processedRecords, totalRecords };
  // }

  private getUniqueBatch(records: LERGRecord[]): LERGRecord[] {
    const uniqueMap = new Map<string, LERGRecord>();

    for (const record of records) {
      const key = record.npa;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, record);
      }
    }

    return Array.from(uniqueMap.values());
  }

  private async processBatch(batch: LERGRecord[]): Promise<number> {
    try {
      const inserted = await this.insertBatch(batch);
      logger.info(`[lerg.service.ts] Processed batch: ${inserted} unique NPAs inserted out of ${batch.length} records`);
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

    const values = records.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(',');

    const params = records.flatMap(record => [record.npa, record.state, record.country, record.last_updated]);

    const query = `
      INSERT INTO lerg_codes
      (npa, state, country, last_updated)
      VALUES ${values}
      ON CONFLICT ON CONSTRAINT lerg_codes_npa_unique DO NOTHING
      RETURNING npa;
    `;

    try {
      const result = await this.db.query(query, params);
      logger.info(
        'Successfully inserted NPANXXs:',
        result.rows.map(r => r.npa)
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
            SELECT npa, state, country
            FROM lerg_codes 
            ORDER BY npa
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
    try {
      await this.db.query('TRUNCATE TABLE lerg_codes');
      logger.info('[lerg.service.ts] LERG data cleared successfully');
    } catch (error) {
      logger.error('[lerg.service.ts] Error clearing LERG data:', error);
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
      // First check if table exists
      const result = await this.db.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'lerg_codes'
        ) as has_lerg
      `);

      logger.info('[lerg.service.ts] Connection test results:', result.rows[0]);
      return result.rows[0].has_lerg;
    } catch (error) {
      logger.error('[lerg.service.ts] Database connection test failed:', error);
      throw error;
    }
  }
}
