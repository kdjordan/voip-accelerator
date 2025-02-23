import { AZStandardizedData } from '@/types/az-types';
import { USStandardizedData } from '@/types/us-types';
import type { DBNameType } from '@/types/app-types';

import { DBName } from '@/types/app-types';
import { useSharedStore } from '@/stores/shared-store';
import { useAzStore } from '@/stores/az-store';
import { useUsStore } from '@/stores/us-store';
import { PlanTier, type UserInfo } from '@/types/user-types';
import { LERGRecord } from '@/types/lerg-types';

type DataType = (typeof DBName)[keyof typeof DBName];

// Process functions
function processData(csvText: string, dataType: DataType): (AZStandardizedData | USStandardizedData)[] {
  if (!csvText) {
    console.error('No CSV text provided to processData');
    return [];
  }

  const rows = csvText
    .trim()
    .split('\n')
    .filter(row => row.length > 0);
  console.log(`Processing ${rows.length} rows for ${dataType}`);

  const processedRows = rows.map((row, index) => {
    const columns = row.split(',');

    if (columns.length < 3) {
      console.error(`Invalid row at index ${index}:`, row);
      return null;
    }

    try {
      if (dataType === DBName.AZ) {
        const [destName, dialCode, rate] = columns;
        if (!destName || !dialCode || !rate) {
          console.error(`Missing data in row ${index}:`, columns);
          return null;
        }
        return {
          destName: destName.trim(),
          dialCode: dialCode.trim(),
          rate: Number(rate.trim()),
        } as AZStandardizedData;
      } else if (dataType === DBName.US) {
        const [, npa, nxx, interRate, intraRate, ijRate] = columns;
        if (!npa || !nxx || !interRate || !intraRate || !ijRate) {
          console.error(`Missing data in row ${index}:`, columns);
          return null;
        }
        let processedNpa = npa.trim();
        if (processedNpa.startsWith('1') && processedNpa.length === 4) {
          processedNpa = processedNpa.slice(1);
        }
        return {
          npa: processedNpa,
          nxx: nxx.trim(),
          npanxx: `${processedNpa}${nxx.trim()}`,
          interRate: Number(interRate.trim()),
          intraRate: Number(intraRate.trim()),
          indetermRate: Number(ijRate.trim()),
        } as USStandardizedData;
      }
    } catch (error) {
      console.error(`Error processing row ${index}:`, error);
      return null;
    }
    throw new Error(`Unsupported data type: ${dataType}`);
  });

  // Filter out null values and ensure type safety
  return processedRows.filter((row): row is AZStandardizedData | USStandardizedData => row !== null);
}










// Exported functions
export function setUser(plan: string, populateDb: boolean, dataTypes: DataType[] = []) {
 return 1;
}



