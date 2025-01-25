import { DBName, type DBNameType } from '@/types/app-types';
import { useAzStore } from '@/stores/az-store';
import { useUsStore } from '@/stores/us-store';
import useDexieDB from '@/composables/useDexieDB';
import { createAZCSVService } from '@/services/az-csv.service';
import { createUSCSVService } from '@/services/us-csv.service';
import type { CSVProcessingConfig } from '@/types/app-types';


function getStoreNameFromFile(fileName: string): string {
  return fileName.replace('.csv', '');
}


export async function loadSampleDecks(dbNames: DBNameType[]): Promise<void> {
  const { storeInDexieDB } = useDexieDB();
  const azStore = useAzStore();
  const usStore = useUsStore();
  const azCSVService = createAZCSVService();
  const usCSVService = createUSCSVService();

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

    if (dbNames.includes(DBName.US)) {
      console.log('Loading US sample data');
      // Load UStest.csv data
      const usTestFile = 'UStest.csv';
      const usTestResponse = await fetch(`/src/data/sample/${usTestFile}`);
      const usTestBlob = new File([await usTestResponse.blob()], usTestFile);

      const usConfig: CSVProcessingConfig = {
        startLine: 1,
        columnMapping: {
          '1': 'npa',
          '2': 'nxx',
          '3': 'interRate',
          '4': 'intraRate',
          '5': 'indetermRate',
        },
      };

      console.log('Processing US test data with config:', usConfig);
      const usTestData = await usCSVService.process(usTestBlob, usConfig);
      console.log('Processed US test data:', usTestData?.[0]); // Let's see what the data looks like
      if (usTestData && usCSVService.validate(usTestData)) {
        const storeName = getStoreNameFromFile(usTestFile);
        await storeInDexieDB(usTestData, DBName.US, storeName);
        usStore.addFileUploaded('us1', storeName);
      }

      // Load UStest1.csv data
      const usTest1File = 'UStest1.csv';
      const usTest1Response = await fetch(`/src/data/sample/${usTest1File}`);
      const usTest1Blob = new File([await usTest1Response.blob()], usTest1File);

      const usTest1Data = await usCSVService.process(usTest1Blob, usConfig);
      if (usTest1Data && usCSVService.validate(usTest1Data)) {
        const storeName = getStoreNameFromFile(usTest1File);
        await storeInDexieDB(usTest1Data, DBName.US, storeName);
        usStore.addFileUploaded('us2', storeName);
      }
    }

    console.log('Sample decks loaded successfully');
  } catch (error) {
    console.error('Error loading sample decks:', error);
    throw error;
  }
}
