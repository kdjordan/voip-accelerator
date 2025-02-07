import { logger } from '@/config/logger';
import type { LERGRecord } from '@/types/lerg.types';
import { Readable } from 'stream';
import { createInterface } from 'readline';
import { EventEmitter } from 'events';

export class LERGFileProcessor extends EventEmitter {
  private processedLines = 0;
  private totalLines = 0;
  private batchSize = 1000;

  constructor() {
    super();
  }

  public async processFile(fileContent: Buffer | string): Promise<LERGRecord[]> {
    try {
      const records: LERGRecord[] = [];
      const content = fileContent.toString();
      const stream = Readable.from(content);
      const rl = createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      // First pass to count lines
      for await (const _ of rl) {
        this.totalLines++;
      }

      // Reset for processing
      const rl2 = createInterface({
        input: Readable.from(content),
        crlfDelay: Infinity,
      });

      let batch: LERGRecord[] = [];
      for await (const line of rl2) {
        this.processedLines++;
        const record = this.parseLergLine(line);
        if (record) {
          batch.push(record);

          if (batch.length >= this.batchSize) {
            records.push(...batch);
            this.emit('progress', {
              processed: this.processedLines,
              total: this.totalLines,
              records: batch.length,
            });
            batch = [];
          }
        }
      }

      // Push final batch
      if (batch.length > 0) {
        records.push(...batch);
        this.emit('progress', {
          processed: this.processedLines,
          total: this.totalLines,
          records: batch.length,
        });
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
      console.log('🔍 Processing LERG line:', { parts });

      // Skip header line
      if (parts[0].toUpperCase() === 'NPA') return null;

      const npa = parts[0];
      const nxx = parts[1];
      const state = parts[3];
      const country = parts[13]; // Country is last column
      console.log('📝 Extracted data:', { npa, nxx, state, country });

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

      // Validate country is 2 characters
      if (!country || country.length !== 2) {
        logger.warn('Invalid country:', { country });
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
}
