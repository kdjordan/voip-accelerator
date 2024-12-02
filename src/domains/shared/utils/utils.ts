import { useUserStore } from '@/stores/userStore';
import { useDBstate } from '@/stores/dbStore';
import { openDB, IDBPDatabase } from 'idb';
import { DBName, PlanTier, AZStandardizedData, USStandardizedData, LergData } from '@/types/app-types';

// Define interfaces for our data structures
interface AZData {
  destName: string;
  dialCode: number;
  rate: number;
  id?: number;
}

interface USData {
  npa: number;
  nxx: number;
  interRate: number;
  intraRate: number;
  ijRate: number;
  id?: number;
}

type DataType = DBName.AZ | DBName.US | DBName.CAN;

// Process functions
function processData(csvText: string, dataType: DataType): (AZStandardizedData | USStandardizedData)[] {
  if (!csvText) {
    console.error('No CSV text provided to processData');
    return [];
  }

  const rows = csvText.trim().split('\n').filter(row => row.length > 0);
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
          dialCode: Number(dialCode.trim()),
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
          npa: Number(processedNpa),
          nxx: Number(nxx.trim()),
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

function processLergData(csvText: string): LergData[] {
  const rows = csvText.trim().split('\n');
  return rows.map(row => {
    const [npanxx, name, npa, nxx] = row.split(',');
    return {
      npanxx: Number(npanxx.trim()),
      name: name.trim(),
      npa: Number(npa.trim()),
      nxx: Number(nxx.trim()),
    };
  });
}

// Store functions
async function storeData(db: IDBPDatabase, storeName: string, data: (AZData | USData)[]): Promise<void> {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);

  for (const item of data) {
    await store.put(item);
  }

  await tx.done;
}

async function storeLergData(db: IDBPDatabase, storeName: string, data: LergData[]): Promise<void> {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);

  for (const item of data) {
    await store.put(item);
  }

  await tx.done;
}

// Load functions
async function loadDb(dataType: DataType): Promise<void> {
  try {
    const dbName = dataType === DBName.AZ ? DBName.AZ : DBName.US;
    const db = await openDB(dbName, 1, {
      upgrade(db) {
        if (dataType === DBName.AZ) {
          db.createObjectStore('AZtest1.csv', { keyPath: 'id', autoIncrement: true });
          db.createObjectStore('AZtest2.csv', { keyPath: 'id', autoIncrement: true });
        } else if (dataType === DBName.US) {
          db.createObjectStore('npa_nxx.csv', { keyPath: 'id', autoIncrement: true });
        }
      },
    });

    const DBstore = useDBstate();

    if (dataType === DBName.AZ) {
      const csvFile1 = await import('@/data/sample/AZtest1.csv?raw');
      const csvTextFile1 = csvFile1.default;
      DBstore.addFileUploaded('az1', DBName.AZ, 'AZtest1.csv');

      const csvFile2 = await import('@/data/sample/AZtest2.csv?raw');
      const csvTextFile2 = csvFile2.default;
      DBstore.addFileUploaded('az2', DBName.AZ, 'AZtest2.csv');

      const dataFile1 = processData(csvTextFile1, DBName.AZ);
      await storeData(db, 'AZtest1.csv', dataFile1);

      const dataFile2 = processData(csvTextFile2, DBName.AZ);
      await storeData(db, 'AZtest2.csv', dataFile2);
    } else if (dataType === DBName.US) {
      const responseFile = await fetch('/data/npa_nxx.csv');
      const csvTextFile = await responseFile.text();
      DBstore.addFileUploaded('us1', DBName.US, 'npa_nxx.csv');

      const dataFile = processData(csvTextFile, DBName.US);
      await storeData(db, 'npa_nxx.csv', dataFile);
    }
  } catch (error) {
    console.error(`Error loading ${dataType} CSV into IndexedDB:`, error);
  }
}

async function loadLergData(): Promise<void> {
  try {
    const db = await openDB(DBName.USCodes, 1, {
      upgrade(db) {
        db.createObjectStore('lerg.csv', {
          keyPath: 'npanxx',
          autoIncrement: false,
        });
      },
    });

    const response = await fetch('/src/data/lerg.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch lerg.csv: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const data = processLergData(csvText);
    await storeLergData(db, 'lerg.csv', data);
    
  } catch (error) {
    console.error('Error loading LERG data:', error);
  }
}

// Exported functions
export function setUser(plan: string, populateDb: boolean, dataTypes: DataType[] = []) {
  const userStore = useUserStore();

  const userInfo = {
    email: plan === 'free' ? 'free@example.com' : 'pro@example.com',
    username: plan === 'free' ? 'FreeUser' : 'ProUser',
    planTier: plan === 'free' ? PlanTier.FREE : PlanTier.PRO,
  };
  userStore.setUser(userInfo);
  if (populateDb) {
    dataTypes.forEach(dataType => loadDb(dataType));
  }
}

export function initializeLergData(): void {
  loadLergData().catch(error => {
    console.error('Background LERG data load failed:', error);
  });
}
