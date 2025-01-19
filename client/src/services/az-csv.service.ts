import { createBaseCSVService } from './base-csv.service';
import type { AZStandardizedData } from '@/types/az-types';

export function createAZCSVService() {
  const baseService = createBaseCSVService<AZStandardizedData>();

  return {
    ...baseService,
    processChunk(chunk: string[], columnMapping: Record<string, string>): AZStandardizedData {
      const mappedData: Record<string, string> = {};

      // Safely map column indices to values
      Object.entries(columnMapping).forEach(([index, field]) => {
        const columnIndex = parseInt(index);
        if (!isNaN(columnIndex) && columnIndex < chunk.length) {
          mappedData[field] = chunk[columnIndex];
        }
      });

      return {
        destName: mappedData['destName'] || '',
        dialCode: mappedData['dialCode'] || '',
        rate: parseFloat(mappedData['rate'] || '0'),
      };
    },

    validate(data: AZStandardizedData[]): boolean {
      return data.every(
        item =>
          typeof item.destName === 'string' &&
          typeof item.dialCode === 'string' &&
          typeof item.rate === 'number' &&
          !isNaN(item.rate)
      );
    },
  };
}
