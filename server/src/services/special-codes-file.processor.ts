import { logger } from '@/config/logger';
import type { SpecialCodeRecord } from '@/types/lerg.types';
const Papa = require('papaparse');

export class SpecialCodesFileProcessor {
  async processFile(fileBuffer: Buffer): Promise<SpecialCodeRecord[]> {
    try {
      logger.info('Processing special codes file...');

      const csvString = fileBuffer.toString('utf-8');
      const { data } = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        trimHeaders: true,
        transform: (value: string) => value.trim(),
      });

      return data.map((record: any) => ({
        npa: record.npa,
        country: record.country,
        province: record.province === 'NULL' ? null : record.province,
      }));
    } catch (error) {
      logger.error('Failed to process special codes file:', error);
      throw error;
    }
  }
}
