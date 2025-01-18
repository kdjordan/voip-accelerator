import { DBName, type DBNameType } from '@/types/app-types';
import { useAzStore } from '@/stores/az-store';
import useDexieDB from '@/composables/useDexieDB';
import { createAZCSVService } from '@/services/az-csv.service';
import type { CSVProcessingConfig } from '@/types/app-types';

function getStoreNameFromFile(fileName: string): string {
  return fileName.replace('.csv', '');
}

export async function cleanupSampleDatabases(dbNames: DBNameType[]): Promise<void> {
  const { deleteDatabase } = useDexieDB();

  try {
    for (const dbName of dbNames) {
      await deleteDatabase(dbName);
    }
    console.log('Successfully cleaned up sample databases');
  } catch (error) {
    console.error('Error cleaning up sample databases:', error);
    throw error;
  }
}

export async function loadSampleDecks(dbNames: DBNameType[]): Promise<void> {
  const { storeInDexieDB } = useDexieDB();
  const azStore = useAzStore();
  const azCSVService = createAZCSVService();

  try {
    console.log('Starting sample deck loading for:', dbNames);

    if (dbNames.includes(DBName.AZ)) {
      // Load AZtest.csv data
      const azTestFile = 'AZtest.csv';
      const azTestResponse = await fetch(`/src/data/sample/${azTestFile}`);
      const azTestBlob = new File([await azTestResponse.blob()], azTestFile);

      const config: CSVProcessingConfig = {
        startLine: 1,
        columnMapping: {
          '0': 'destName',
          '1': 'dialCode',
          '2': 'rate',
        },
      };

      const azTestData = await azCSVService.process(azTestBlob, config);
      if (azTestData && azCSVService.validate(azTestData)) {
        const storeName = getStoreNameFromFile(azTestFile);
        await storeInDexieDB(azTestData, DBName.AZ, storeName);
        azStore.addFileUploaded('az1', storeName);
      }

      // Load AZtest1.csv data
      const azTest1File = 'AZtest1.csv';
      const azTest1Response = await fetch(`/src/data/sample/${azTest1File}`);
      const azTest1Blob = new File([await azTest1Response.blob()], azTest1File);

      const azTest1Data = await azCSVService.process(azTest1Blob, config);
      if (azTest1Data && azCSVService.validate(azTest1Data)) {
        const storeName = getStoreNameFromFile(azTest1File);
        await storeInDexieDB(azTest1Data, DBName.AZ, storeName);
        azStore.addFileUploaded('az2', storeName);
      }
    }

    console.log('Sample decks loaded successfully');
  } catch (error) {
    console.error('Error loading sample decks:', error);
    throw error;
  }
}
