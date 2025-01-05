import useCSVProcessing from '@/composables/useCsvProcessing';
import { DBName, type DBNameType, type ParsedResults } from '@/domains/shared/types';
import { useAzStore } from '@/domains/az/store';
import useIndexedDB from '@/composables/useIndexDB';
import type { AZStandardizedData } from '@/domains/az/types/az-types';
import Papa from 'papaparse';

export async function deleteIndexedDBDatabase(dbName: DBNameType): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);

    request.onerror = () => {
      reject(new Error(`Failed to delete database: ${dbName}`));
    };

    request.onsuccess = () => {
      resolve();
    };

    request.onblocked = () => {
      resolve(); // Still resolve as this isn't a critical error
    };
  });
}

export async function loadSampleDecks(dbNames: DBNameType[]): Promise<void> {
  const { storeInIndexedDB } = useIndexedDB();
  const azStore = useAzStore();

  try {
    if (dbNames.includes(DBName.AZ)) {
      // Load and parse the CSV files - use AZtest1.csv for both
      const response = await fetch('/src/data/sample/AZtest1.csv');
      if (!response.ok) {
        throw new Error(`Failed to load AZtest1.csv: ${response.statusText}`);
      }
      const csvText = await response.text();

      // Parse CSV data for owner file (az1-store)
      const parsedOwnerData = await new Promise<AZStandardizedData[]>((resolve, reject) => {
        Papa.parse<string[]>(csvText, {
          complete: (results: ParsedResults) => {
            const standardizedData: AZStandardizedData[] = results.data
              .filter((row: string[]) => row.length === 3)
              .map((row: string[]) => ({
                destName: String(row[0]).trim(),
                dialCode: Number(row[1]),
                // Slightly increase rates for owner data
                rate: Number((Number(row[2]) * 1.1).toFixed(4)),
              }))
              .filter(
                (item): item is AZStandardizedData =>
                  !isNaN(item.dialCode) && !isNaN(item.rate) && Boolean(item.destName)
              );
            resolve(standardizedData);
          },
          error: reject,
          skipEmptyLines: true,
        });
      });

      // Store owner file first
      const storeName1 = `${azStore.getStoreNameByComponent('az1')}`;
      await storeInIndexedDB(parsedOwnerData, DBName.AZ, 'AZtest.csv', 'az1', true);
      azStore.addFileUploaded('az1', 'AZtest.csv');

      // Parse CSV data for carrier file (using same source file)
      const parsedCarrierData = await new Promise<AZStandardizedData[]>((resolve, reject) => {
        Papa.parse<string[]>(csvText, {
          complete: (results: ParsedResults) => {
            const standardizedData: AZStandardizedData[] = results.data
              .filter((row: string[]) => row.length === 3)
              .map((row: string[]) => ({
                destName: String(row[0]).trim(),
                dialCode: Number(row[1]),
                rate: Number(row[2]), // Keep original rates for carrier
              }))
              .filter(
                (item): item is AZStandardizedData =>
                  !isNaN(item.dialCode) && !isNaN(item.rate) && Boolean(item.destName)
              );
            resolve(standardizedData);
          },
          error: reject,
          skipEmptyLines: true,
        });
      });

      // Store carrier file second
      const storeName2 = `${azStore.getStoreNameByComponent('az2')}`;
      await storeInIndexedDB(parsedCarrierData, DBName.AZ, 'AZtest1.csv', 'az2', true);
      azStore.addFileUploaded('az2', 'AZtest1.csv');
    }

    console.log('Sample decks loaded successfully');
  } catch (error) {
    console.error('Error loading sample decks:', error);
    throw error;
  }
}

async function loadNPANXXSampleDecks(csvProcessing: ReturnType<typeof useCSVProcessing>) {
  const ownerFile = new File([''], '/src/data/npanxx-owner-sample.csv');
  const carrierFile = new File([''], '/src/data/npanxx-carrier-sample.csv');

  try {
    csvProcessing.deckType.value = DBName.US;
    csvProcessing.DBname.value = DBName.US;

    // Load owner deck
    csvProcessing.file.value = ownerFile;
    csvProcessing.componentName.value = 'owner';
    csvProcessing.columnRoles.value = ['NPANXX', 'inter', 'intra'];
    csvProcessing.startLine.value = 1;
    await csvProcessing.parseCSVForFullProcessing();

    // Load carrier deck
    csvProcessing.file.value = carrierFile;
    csvProcessing.componentName.value = 'carrier';
    csvProcessing.columnRoles.value = ['NPANXX', 'inter', 'intra'];
    csvProcessing.startLine.value = 1;
    await csvProcessing.parseCSVForFullProcessing();
  } catch (error) {
    console.error('Error loading NPANXX sample decks:', error);
  }
}
