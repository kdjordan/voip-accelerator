import useCSVProcessing from '@/composables/useCsvProcessing';
import { DBName, type DBNameType, type ParsedResults } from '@/types';
import { useAzStore } from '@/stores/az-store';
import { useUsStore } from '@/stores/us-store';
import useIndexedDB from '@/composables/useIndexDB';
import type { AZStandardizedData } from '@/types/az-types';
import Papa from 'papaparse';

// export async function deleteIndexedDBDatabase(dbName: DBNameType): Promise<void> {
//   return new Promise((resolve, reject) => {
//     const request = indexedDB.deleteDatabase(dbName);

//     request.onerror = () => {
//       reject(new Error(`Failed to delete database: ${dbName}`));
//     };

//     request.onsuccess = () => {
//       resolve();
//     };

//     request.onblocked = () => {
//       resolve(); // Still resolve as this isn't a critical error
//     };
//   });
// }

export async function loadSampleDecks(dbNames: DBNameType[]): Promise<void> {
  const { storeInIndexedDB } = useIndexedDB();
  const azStore = useAzStore();
  const usStore = useUsStore();

  try {
    console.log('Starting sample deck loading for:', dbNames);

    if (dbNames.includes(DBName.AZ)) {
      async function parseAZData(filename: string): Promise<AZStandardizedData[]> {
        const response = await fetch(`/src/data/sample/${filename}`);
        if (!response.ok) {
          throw new Error(`Failed to load ${filename}: ${response.statusText}`);
        }
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
          Papa.parse<string[]>(csvText, {
            complete: (results: ParsedResults) => {
              const standardizedData: AZStandardizedData[] = results.data
                .filter((row: string[]) => row.length === 3)
                .map((row: string[]) => ({
                  destName: String(row[0]).trim(),
                  dialCode: Number(row[1]),
                  rate: Number(row[2]),
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
      }

      // Load AZtest.csv data
      const azTestData = await parseAZData('AZtest.csv');
      await storeInIndexedDB(azTestData, DBName.AZ, 'AZtest.csv', 'az1', true);
      azStore.addFileUploaded('az1', 'AZtest');

      // Load AZtest1.csv data
      const azTest1Data = await parseAZData('AZtest1.csv');
      await storeInIndexedDB(azTest1Data, DBName.AZ, 'AZtest1.csv', 'az2', true);
      azStore.addFileUploaded('az2', 'AZtest1');
    }

    if (dbNames.includes(DBName.US)) {
      console.log('Loading US sample decks...');
      // Add US loading logic here similar to AZ
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
