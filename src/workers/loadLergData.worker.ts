import { openDB, IDBPDatabase } from 'idb'
import { DBName, LergData } from '@/types/app-types'

// Define the database schema type
interface LergDB {
  'lerg.csv': {
    key: number;
    value: LergData;
  };
}

export async function loadLergData(): Promise<void> {
  try {
    const db = await openDB<LergDB>(DBName.USCodes, 1, {
      upgrade(db) {
        db.createObjectStore('lerg.csv', {
          keyPath: 'npanxx',
          autoIncrement: false,
        })
      },
    })

    const response = await fetch('/src/data/lerg.csv')
    const csvText = await response.text()
    const data = processLergData(csvText)
    
    await storeInIndexDB(db, data)
    
  } catch (error) {
    console.error('Error loading LERG data:', error)
  }
}

function processLergData(csvText: string): LergData[] {
  const rows = csvText.trim().split('\n')
  return rows.map(row => {
    const [npanxx, name, npa, nxx] = row.split(',')
    return {
      npanxx: Number(npanxx.trim()),
      name: name.trim(),
      npa: Number(npa.trim()),
      nxx: Number(nxx.trim()),
    }
  })
}

async function storeInIndexDB(db: IDBPDatabase<LergDB>, data: LergData[]): Promise<void> {
  const tx = db.transaction('lerg.csv', 'readwrite')
  const store = tx.objectStore('lerg.csv')
  
  for (const item of data) {
    await store.put(item)
  }
  
  await tx.done
}