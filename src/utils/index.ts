import useCSVProcessing from '@/composables/useCsvProcessing';
import { DBName, type DBNameType } from '@/domains/shared/types';
import { useAzStore } from '@/domains/az/store';

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

export async function loadSampleDecks(deckTypes: DBNameType[]): Promise<void> {
  const csvProcessing = useCSVProcessing();

  for (const deckType of deckTypes) {
    switch (deckType) {
      case DBName.AZ:
        await loadAZSampleDecks(csvProcessing);
        break;
      case DBName.US:
        await loadNPANXXSampleDecks(csvProcessing);
        break;
      default:
        console.warn(`Sample deck type ${deckType} not supported`);
    }
  }
}

async function loadAZSampleDecks(csvProcessing: ReturnType<typeof useCSVProcessing>) {
  try {
    const azStore = useAzStore();

    // Load owner deck first
    const ownerResponse = await fetch('/src/data/sample/AZtestshort.csv');
    const ownerContent = await ownerResponse.text();
    const ownerFile = new File([ownerContent], 'AZtestshort.csv', { type: 'text/csv' });

    // Process owner file
    csvProcessing.deckType.value = DBName.AZ;
    csvProcessing.DBname.value = DBName.AZ;
    csvProcessing.file.value = ownerFile;
    csvProcessing.componentName.value = 'az1';
    csvProcessing.columnRoles.value = ['destName', 'dialCode', 'rate'];
    csvProcessing.startLine.value = 1;
    await csvProcessing.parseCSVForFullProcessing();
    azStore.addFileUploaded('az1', ownerFile.name);

    // Then load carrier file
    const carrierResponse = await fetch('/src/data/sample/AZtest1short.csv');
    const carrierContent = await carrierResponse.text();
    const carrierFile = new File([carrierContent], 'AZtest1short.csv', { type: 'text/csv' });

    // Process carrier file
    csvProcessing.file.value = carrierFile;
    csvProcessing.componentName.value = 'az2';
    csvProcessing.columnRoles.value = ['destName', 'dialCode', 'rate'];
    csvProcessing.startLine.value = 1;
    await csvProcessing.parseCSVForFullProcessing();
    azStore.addFileUploaded('az2', carrierFile.name);
  } catch (error) {
    console.error('Error loading AZ sample decks:', error);
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
