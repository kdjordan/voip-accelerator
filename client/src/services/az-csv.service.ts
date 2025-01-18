import Papa from 'papaparse';
import type { CSVProcessor } from '@/services/csv.service';
import type { CSVProcessingConfig } from '@/types/app-types';
import type { AZStandardizedData } from '@/types/az-types';

export function createAZCSVService(): CSVProcessor<AZStandardizedData> {
  return {
    async process(file: File, config: CSVProcessingConfig): Promise<AZStandardizedData[]> {
      const rawData = await parseCSVFile(file);
      const validatedData = validateAZData(rawData, config);
      return transformAZData(validatedData, config);
    },

    validate(data: AZStandardizedData[]): boolean {
      return data.every(
        row => typeof row.destName === 'string' && row.destName.length > 0 && !isNaN(row.dialCode) && !isNaN(row.rate)
      );
    },
  };
}

async function parseCSVFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: results => {
        if (results.errors.length > 0) {
          reject(new Error('CSV parsing failed: ' + results.errors[0].message));
        }
        resolve(results.data as string[][]);
      },
      error: error => reject(error),
    });
  });
}

function validateAZData(data: string[][], config: CSVProcessingConfig): string[][] {
  return data.slice(config.startLine - 1).filter(row => {
    const hasRequiredColumns = row.length >= Object.keys(config.columnMapping).length;
    const hasValidData = row.every(cell => cell !== null && cell !== undefined && cell.trim() !== '');
    return hasRequiredColumns && hasValidData;
  });
}

function transformAZData(data: string[][], config: CSVProcessingConfig): AZStandardizedData[] {
  return data.map(row => {
    const standardizedRow: AZStandardizedData = {
      destName: '',
      dialCode: 0,
      rate: 0,
    };

    Object.entries(config.columnMapping).forEach(([index, role]) => {
      const value = row[parseInt(index)].trim();
      switch (role) {
        case 'destName':
          standardizedRow.destName = value;
          break;
        case 'dialCode':
          standardizedRow.dialCode = parseFloat(value) || 0;
          break;
        case 'rate':
          standardizedRow.rate = parseFloat(value) || 0;
          break;
      }
    });

    return standardizedRow;
  });
}
