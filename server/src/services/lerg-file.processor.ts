import { logger } from '@/config/logger';
import type { LERGRecord } from '@/types/lerg.types';

export class LERGFileProcessor {
  // Process the entire file
  public async processFile(fileContent: Buffer | string): Promise<LERGRecord[]> {
    try {
      const lines = fileContent.toString().split('\n');
      const records: LERGRecord[] = [];

      for (const line of lines) {
        const record = this.parseLergLine(line);
        if (record) {
          records.push(record);
        }
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
        last_updated: new Date(),
      };
    } catch (error) {
      logger.error('Error parsing LERG line:', error);
      return null;
    }
  }
}
