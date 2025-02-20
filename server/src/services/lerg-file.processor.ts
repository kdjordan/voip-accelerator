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
  private currentLine = 0;
  private stats = {
    invalidNpa: 0,
    invalidState: 0,
    invalidCountry: 0,
    emptyLines: 0,
  };

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

  public async processFile(
    fileContent: Buffer | string,
    mappings: Record<string, string>,
    startLine: number
  ): Promise<LERGRecord[]> {
    try {
      const records: LERGRecord[] = [];
      const content = fileContent.toString();
      const stream = Readable.from(content);
      const rl = createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      let batch: LERGRecord[] = [];
      let validRecords = 0;
      let skippedRecords = 0;

      for await (const line of rl) {
        this.currentLine++;

        // Skip lines before startLine
        if (this.currentLine < startLine) {
          continue;
        }

        this.processedLines++;
        const record = this.parseLergLine(line, mappings);
        if (record) {
          validRecords++;
          console.debug('[lerg-file.processor.ts] Valid record found:', { npa: record.npa, state: record.state });
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
      console.error('[lerg-file.processor.ts] Error processing LERG file:', error);
      throw error;
    }
  }

  // Parse individual lines
  private parseLergLine(line: string, mappings: Record<string, string>): LERGRecord | null {
    try {
      if (!line.trim()) return null;

      // Split by comma but preserve empty cells
      const parts = line.split(',').map(part => {
        // Remove quotes and trim, but keep empty cells as empty strings
        const cleaned = part.replace(/^"|"$/g, '').trim();
        return cleaned === '' ? '' : cleaned;
      });

      // Ensure we have enough elements in the array
      while (
        parts.length <=
        Math.max(
          this.findColumnIndex(mappings, 'npa'),
          this.findColumnIndex(mappings, 'state'),
          this.findColumnIndex(mappings, 'country')
        )
      ) {
        parts.push('');
      }


      // Use mappings to get values
      const npa = parts[this.findColumnIndex(mappings, 'npa')];
      const state = parts[this.findColumnIndex(mappings, 'state')];
      const country = parts[this.findColumnIndex(mappings, 'country')];



      // Validate NPA
      if (!/^\d{3}$/.test(npa)) {
        this.stats.invalidNpa++;
        return null;
      }

      // Validate state is 2 characters
      if (!state || state.length !== 2) {
        this.stats.invalidState++;
        return null;
      }

      // Validate country is 2 characters
      if (!country || country.length !== 2) {
        this.stats.invalidCountry++;
        return null;
      }

      return {
        npa,
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

  private findColumnIndex(mappings: Record<string, string>, fieldName: string): number {
    const entry = Object.entries(mappings).find(([_, value]) => value.toLowerCase() === fieldName.toLowerCase());
    return entry ? parseInt(entry[0]) : -1;
  }
}
