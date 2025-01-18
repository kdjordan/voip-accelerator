import Dexie from 'dexie';
import { DB_NAMES } from '@/types/app-types';
import { useAzStore } from '@/stores/az-store';
import useDexieDB from '@/composables/useDexieDB';
import useCSVProcessing from '@/composables/useCsvProcessing';
import type { DBNameType } from '@/types/app-types';

export async function deleteIndexedDBDatabase(dbName: DBNameType): Promise<void> {
  try {
    await Dexie.delete(dbName);
  } catch (error) {
    console.error(`Failed to delete database: ${dbName}`, error);
    throw error;
  }
}

export async function loadSampleDecks(dbNames: DBNameType[]): Promise<void> {
  const { storeInDexieDB } = useDexieDB();
  const azStore = useAzStore();
  const csvProcessing = useCSVProcessing();

  try {
    console.log('Starting sample deck loading for:', dbNames);

    if (dbNames.includes(DB_NAMES.AZ)) {
      // Configure CSV processing for AZ data
      csvProcessing.deckType.value = DB_NAMES.AZ;
      csvProcessing.DBname.value = DB_NAMES.AZ;
      csvProcessing.startLine.value = 1;
      csvProcessing.columnRoles.value = ['destName', 'dialCode', 'rate'];

      // Load AZtest.csv data
      const azTestResponse = await fetch('/src/data/sample/AZtest.csv');
      const azTestBlob = await azTestResponse.blob();
      csvProcessing.file.value = new File([azTestBlob], 'AZtest.csv');
      const azTestData = await csvProcessing.parseCSVForFullProcessing();
      if (azTestData) {
        await storeInDexieDB(azTestData, DB_NAMES.AZ, 'az1');
        azStore.addFileUploaded('az1', 'AZtest');
      }

      // Load AZtest1.csv data
      const azTest1Response = await fetch('/src/data/sample/AZtest1.csv');
      const azTest1Blob = await azTest1Response.blob();
      csvProcessing.file.value = new File([azTest1Blob], 'AZtest1.csv');
      const azTest1Data = await csvProcessing.parseCSVForFullProcessing();
      if (azTest1Data) {
        await storeInDexieDB(azTest1Data, DB_NAMES.AZ, 'az2');
        azStore.addFileUploaded('az2', 'AZtest1');
      }
    }

    console.log('Sample decks loaded successfully');
  } catch (error) {
    console.error('Error loading sample decks:', error);
    throw error;
  }
}
