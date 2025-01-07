import { useSharedStore } from '@/domains/shared/store';
import { useAzStore } from '@/domains/az/store';
import { useUsStore } from '@/domains/us/store';
import { db } from '@/db';
import Papa, { ParseResult } from 'papaparse';
import { DBName, PlanTier, type DataType } from '@/domains/shared/types';
import type { AZStandardizedData } from '@/domains/az/types/az-types';
import type { USStandardizedData } from '@/domains/us/types/us-types';
import type { LERGRecord } from '@/domains/lerg/types';
import type { AZTable, USTable } from '@/db/types';

// Add this type helper at the top with other imports
type USTableData = Omit<USTable, 'id'> & {
  npa: string;
  nxx: string;
  npanxx: string;
  interRate: number;
  intraRate: number;
  ijRate: number;
  createdAt: Date;
  updatedAt: Date;
};

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
          ijRate: Number(ijRate.trim()),
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

function processLergData(csvText: string): LERGRecord[] {
  const rows = csvText.trim().split('\n');
  return rows.map(row => {
    const [npanxx, name, npa, nxx] = row.split(',');
    return {
      npanxx: npanxx.trim(),
      name: name.trim(),
      npa: npa.trim(),
      nxx: nxx.trim(),
      state: '',
    };
  });
}

// Load functions
async function loadDb(dataType: DataType): Promise<void> {
  try {
    if (dataType === DBName.AZ) {
      const azStore = useAzStore();

      // Load and parse the CSV files
      const response = await fetch('/src/data/sample/AZtest1.csv');
      if (!response.ok) {
        throw new Error(`Failed to load AZtest1.csv: ${response.statusText}`);
      }
      const csvText = await response.text();

      // Process owner data with increased rates
      const parsedOwnerData = await new Promise<AZTable[]>((resolve, reject) => {
        Papa.parse<string[]>(csvText, {
          complete: (results: ParseResult<string[]>) => {
            const now = new Date();
            const standardizedData = results.data
              .filter((row: string[]) => row.length === 3)
              .map((row: string[]) => ({
                destName: String(row[0]).trim(),
                dialCode: row[1].trim(),
                rate: Number((Number(row[2]) * 1.1).toFixed(4)),
                createdAt: now,
                updatedAt: now,
              }))
              .filter((item): item is AZTable => Boolean(item.destName) && !isNaN(item.rate));
            resolve(standardizedData);
          },
          error: reject,
          skipEmptyLines: true,
        });
      });

      // Store owner data and update store
      await db.az.bulkPut(parsedOwnerData);
      azStore.addFileUploaded('az1', 'AZtest.csv');

      // Process carrier data with original rates
      const parsedCarrierData = await new Promise<AZTable[]>((resolve, reject) => {
        Papa.parse<string[]>(csvText, {
          complete: (results: ParseResult<string[]>) => {
            const now = new Date();
            const standardizedData = results.data
              .filter((row: string[]) => row.length === 3)
              .map((row: string[]) => ({
                destName: String(row[0]).trim(),
                dialCode: row[1].trim(),
                rate: Number(row[2]),
                createdAt: now,
                updatedAt: now,
              }))
              .filter((item): item is AZTable => Boolean(item.destName) && !isNaN(item.rate));
            resolve(standardizedData);
          },
          error: reject,
          skipEmptyLines: true,
        });
      });

      // Store carrier data and update store
      await db.az.bulkPut(parsedCarrierData);
      azStore.addFileUploaded('az2', 'AZtest1.csv');
    } else if (dataType === DBName.US) {
      const usStore = useUsStore();

      // Load and parse the CSV files
      const response = await fetch('/src/data/sample/UStest1.csv');
      if (!response.ok) {
        throw new Error(`Failed to load UStest1.csv: ${response.statusText}`);
      }
      const csvText = await response.text();

      // Process owner data
      const parsedOwnerData = await new Promise<USTable[]>((resolve, reject) => {
        Papa.parse<string[]>(csvText, {
          complete: (results: ParseResult<string[]>) => {
            const now = new Date();
            const standardizedData = results.data
              .filter((row: string[]) => row.length >= 5)
              .map((row: string[]) => {
                const [, npa, nxx, interRate, intraRate, ijRate] = row;
                const npanxx = `${npa.trim()}${nxx.trim()}`;
                const data: USTableData = {
                  createdAt: now,
                  updatedAt: now,
                  npa: npa.trim(),
                  nxx: nxx.trim(),
                  npanxx,
                  interRate: Number((Number(interRate) * 1.1).toFixed(4)),
                  intraRate: Number((Number(intraRate) * 1.1).toFixed(4)),
                  ijRate: Number((Number(ijRate || 0) * 1.1).toFixed(4)),
                };
                return data;
              })
              .filter(
                (item): item is USTableData =>
                  Boolean(item.npa) &&
                  Boolean(item.nxx) &&
                  Boolean(item.npanxx) &&
                  !isNaN(item.interRate) &&
                  !isNaN(item.intraRate)
              );
            resolve(standardizedData);
          },
          error: reject,
          skipEmptyLines: true,
        });
      });

      // Store owner data and update store
      await db.us.bulkPut(parsedOwnerData);
      usStore.addFileUploaded('us1', 'UStest.csv');

      // Process carrier data with original rates
      const parsedCarrierData = await new Promise<USTable[]>((resolve, reject) => {
        Papa.parse<string[]>(csvText, {
          complete: (results: ParseResult<string[]>) => {
            const now = new Date();
            const standardizedData = results.data
              .filter((row: string[]) => row.length >= 5)
              .map((row: string[]) => {
                const [, npa, nxx, interRate, intraRate, ijRate] = row;
                const npanxx = `${npa.trim()}${nxx.trim()}`;
                return {
                  createdAt: now,
                  updatedAt: now,
                  npa: npa.trim(),
                  nxx: nxx.trim(),
                  npanxx,
                  interRate: Number(interRate),
                  intraRate: Number(intraRate),
                  ijRate: Number(ijRate || 0),
                } satisfies USTable;
              });
            resolve(standardizedData);
          },
          error: reject,
          skipEmptyLines: true,
        });
      });

      // Store carrier data and update store
      await db.us.bulkPut(parsedCarrierData);
      usStore.addFileUploaded('us2', 'UStest1.csv');
    }

    console.log(`Sample ${dataType} decks loaded successfully`);
  } catch (error) {
    console.error(`Error loading ${dataType} sample decks:`, error);
    throw error;
  }
}

async function loadLergData(): Promise<void> {
  try {
    // Load LERG CSV data
    const response = await fetch('/src/data/lerg.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch lerg.csv: ${response.statusText}`);
    }

    const csvText = await response.text();
    const data = processLergData(csvText);

    // Store directly in Dexie LERG table
    await db.lerg.bulkPut(
      data.map(record => ({
        ...record,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );

    console.log('LERG data loaded successfully');
  } catch (error) {
    console.error('Error loading LERG data:', error);
    throw error;
  }
}

// Exported functions
export function setUser(plan: string, populateDb: boolean, dataTypes: DataType[] = []) {
  const sharedStore = useSharedStore();

  const userInfo = {
    id: plan === 'free' ? 1 : 2,
    email: plan === 'free' ? 'free@example.com' : 'pro@example.com',
    username: plan === 'free' ? 'FreeUser' : 'ProUser',
    planTier: plan === 'free' ? PlanTier.FREE : PlanTier.PRO,
    createdAt: new Date(),
  };

  sharedStore.setUser(userInfo);

  if (populateDb) {
    dataTypes.forEach(dataType => loadDb(dataType));
  }
}

export function initializeLergData(): void {
  loadLergData().catch(error => {
    console.error('Background LERG data load failed:', error);
  });
}
