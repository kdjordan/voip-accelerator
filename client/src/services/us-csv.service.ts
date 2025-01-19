import { createBaseCSVService } from './base-csv.service';
import type { USStandardizedData } from '@/types/us-types';

export function createUSCSVService() {
  const baseService = createBaseCSVService<USStandardizedData>();

  return {
    ...baseService,
    processChunk(chunk: string[], columnMapping: Record<string, string>): USStandardizedData {
      const mappedData: Record<string, string> = {};
      

      Object.entries(columnMapping).forEach(([index, field]) => {
        const columnIndex = parseInt(index);
        if (!isNaN(columnIndex) && columnIndex < chunk.length) {
          mappedData[field] = chunk[columnIndex];
        }
      });

      const npa = mappedData['npa'] || '';
      const nxx = mappedData['nxx'] || '';

      // Log generated npanxx
      const result = {
        npa,
        nxx,
        npanxx: `${npa}${nxx}`,
        interRate: parseFloat(mappedData['interRate'] || '0'),
        intraRate: parseFloat(mappedData['intraRate'] || '0'),
        indetermRate: parseFloat(mappedData['indetermRate'] || '0'),
      };

      return result;
    },

    validate(data: USStandardizedData[]): boolean {
      return data.every(
        item =>
          typeof item.npa === 'string' &&
          typeof item.nxx === 'string' &&
          typeof item.npanxx === 'string' &&
          typeof item.interRate === 'number' &&
          typeof item.intraRate === 'number' &&
          typeof item.indetermRate === 'number' &&
          !isNaN(item.interRate) &&
          !isNaN(item.intraRate) &&
          !isNaN(item.indetermRate)
      );
    },
  };
}
