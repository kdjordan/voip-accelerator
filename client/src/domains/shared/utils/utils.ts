import { AZStandardizedData } from '@/domains/az/types/az-types';
import { USStandardizedData } from '@/domains/us/types/us-types';
import { openDB, IDBPDatabase } from 'idb';
import { DBName } from '@/domains/shared/types/app-types';
import { useSharedStore } from '@/domains/shared/store';
import { useAzStore } from '@/domains/az/store';
import { useUsStore } from '@/domains/us/store';
import { PlanTier, type UserInfo } from '@/domains/shared/types/user-types';
import { LERGRecord } from '@/domains/lerg/types/types';

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
//don not remove
function processLergData(csvText: string): LERGRecord[] {
  const rows = csvText.trim().split('\n');
  return rows.map(row => {
    const [npanxx, state, npa, nxx] = row.split(',');
    return {
      npanxx: npanxx.trim(),
      state: state.trim(),
      npa: npa.trim(),
      nxx: nxx.trim(),
    };
  });
}

//don not remove
async function storeData(
  db: IDBPDatabase,
  storeName: string,
  data: (AZStandardizedData | USStandardizedData)[]
): Promise<void> {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);

  for (const item of data) {
    await store.put(item);
  }

  await tx.done;
}

async function storeLergData(db: IDBPDatabase, storeName: string, data: LERGRecord[]): Promise<void> {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);

  for (const item of data) {
    await store.put(item);
  }

  await tx.done;
}

//don not remove
async function loadDb(dataType: DataType): Promise<void> {
  try {
    const db = await openDB(dataType, 1, {
      upgrade(db) {
        if (dataType === DBName.AZ) {
          db.createObjectStore('AZtest1.csv', { keyPath: 'id', autoIncrement: true });
          db.createObjectStore('AZtest2.csv', { keyPath: 'id', autoIncrement: true });
        } else if (dataType === DBName.US) {
          db.createObjectStore('USTest.csv', { keyPath: 'id', autoIncrement: true });
          db.createObjectStore('UStest1.csv', { keyPath: 'id', autoIncrement: true });
        }
      },
    });

    if (dataType === DBName.AZ) {
      const [csvFile1, csvFile2] = await Promise.all([
        import('@/data/sample/AZtest.csv?raw'),
        import('@/data/sample/AZtest1.csv?raw'),
      ]);

      const azStore = useAzStore();
      azStore.addFileUploaded('az1', 'AZtest1.csv');
      azStore.addFileUploaded('az2', 'AZtest2.csv');

      const data1 = processData(csvFile1.default, DBName.AZ);
      const data2 = processData(csvFile2.default, DBName.AZ);

      await Promise.all([storeData(db, 'AZtest1.csv', data1), storeData(db, 'AZtest2.csv', data2)]);
    } else if (dataType === DBName.US) {
      console.log('Starting US sample data load...');

      const [csvFile1, csvFile2] = await Promise.all([
        import('@/data/sample/UStest.csv?raw'),
        import('@/data/sample/UStest1.csv?raw'),
      ]);
      console.log('US CSV files loaded:', {
        file1: csvFile1 ? 'loaded' : 'failed',
        file2: csvFile2 ? 'loaded' : 'failed',
      });

      const usStore = useUsStore();
      usStore.addFileUploaded('us1', 'USTest.csv');
      usStore.addFileUploaded('us2', 'UStest1.csv');
      console.log('US store updated with file names');

      const data1 = processData(csvFile1.default, DBName.US);
      const data2 = processData(csvFile2.default, DBName.US);
      console.log('US data processed:', {
        data1Length: data1.length,
        data2Length: data2.length,
      });

      await Promise.all([storeData(db, 'USTest.csv', data1), storeData(db, 'UStest1.csv', data2)]);
      console.log('US data stored in IndexedDB');
    }
  } catch (error) {
    console.error(`Error loading ${dataType} CSV into IndexedDB:`, error);
  }
}

async function loadLergData(): Promise<void> {
  try {
    const db = await openDB(DBName.LERG, 1, {
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
  const userStore = useSharedStore();

  const userInfo: Omit<UserInfo, 'lastLoggedIn'> = {
    id: plan === 'free' ? 'free-user' : 'pro-user',
    email: plan === 'free' ? 'free@example.com' : 'pro@example.com',
    username: plan === 'free' ? 'FreeUser' : 'ProUser',
    planTier: plan === 'free' ? PlanTier.FREE : PlanTier.PRO,
    createdAt: new Date(),
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

export async function loadSampleDecks(dbNames: DBNameType[]): Promise<void> {
  try {
    console.log('loadSampleDecks called with:', dbNames);

    for (const dbName of dbNames) {
      console.log(`Processing ${dbName}...`);

      if (dbName === DBName.AZ) {
        await loadDb(DBName.AZ);
      } else if (dbName === DBName.US) {
        console.log('Found US in dbNames, attempting to load...');
        await loadDb(DBName.US);
      }
    }

    console.log('Sample decks load attempt complete');
  } catch (error) {
    console.error('Error in loadSampleDecks:', error);
    throw error;
  }
}
