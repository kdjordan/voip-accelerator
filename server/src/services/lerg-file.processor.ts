import { logger } from '@/config/logger';
import type { LERGRecord } from '@/types/lerg.types';
import { Readable } from 'stream';
import { createInterface } from 'readline';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

export class LERGFileProcessor extends EventEmitter {
  private processedLines = 0;
  private totalLines = 0;
  private batchSize = 1000;
  private errorLogPath: string;

  constructor() {
    super();
    this.errorLogPath = path.join(process.cwd(), 'logs', 'lerg-processing-errors.log');
    // Ensure logs directory exists
    fs.mkdirSync(path.dirname(this.errorLogPath), { recursive: true });
  }

  private logError(error: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${error}\n${data ? JSON.stringify(data, null, 2) : ''}\n\n`;
    fs.appendFileSync(this.errorLogPath, logEntry);
  }

  public async processFile(fileContent: Buffer | string): Promise<LERGRecord[]> {
    try {
      const records: LERGRecord[] = [];
      const content = fileContent.toString();
      console.log('🔍 Starting LERG file processing');
      const stream = Readable.from(content);
      const rl = createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      let batch: LERGRecord[] = [];
      let validRecords = 0;
      let skippedRecords = 0;

      for await (const line of rl) {
        this.processedLines++;
        const record = this.parseLergLine(line);
        if (record) {
          validRecords++;
          batch.push(record);
          if (batch.length >= this.batchSize) {
            records.push(...batch);
            batch = [];
          }
        } else {
          skippedRecords++;
        }
      }

      console.log('📈 LERG Processing Stats:', {
        totalLines: this.totalLines,
        processedLines: this.processedLines,
        validRecords,
        skippedRecords,
        finalRecordCount: records.length + batch.length,
      });

      // Push final batch
      if (batch.length > 0) {
        records.push(...batch);
      }

      return records;
    } catch (error) {
      logger.error('Error processing LERG file:', error);
      throw error;
    }
  }

  // Parse individual lines
  private parseLergLine(line: string): LERGRecord | null {
    try {
      if (!line.trim()) return null;

      const parts = line.split(',').map(part => part.replace(/^"|"$/g, '').trim());

      // Skip header line
      if (parts[0].toUpperCase() === 'NPA') return null;

      const npa = parts[0];
      const nxx = parts[1];
      const state = parts[3];
      const country = parts[parts.length - 1];

      // Validate NPA and NXX
      if (!/^\d{3}$/.test(npa) || !/^\d{3}$/.test(nxx)) {
        this.logError('Invalid NPA/NXX', { line, npa, nxx });
        return null;
      }

      // Validate state is 2 characters
      if (!state || state.length !== 2) {
        this.logError('Invalid state', { line, state });
        return null;
      }

      // Validate country is 2 characters
      if (!country || country.length !== 2) {
        this.logError('Invalid country', { line, country });
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
      this.logError('Error parsing LERG line', {
        line,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}
