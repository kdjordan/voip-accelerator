import { useUserStore } from "@/stores/userStore";
import { useDBstate } from "@/stores/dbStore";
import { openDB, IDBPDatabase } from "idb";
import {
  DBName,
  PlanTier,
  AZStandardizedData,
  USStandardizedData,
} from "@/types/app-types";

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

export function setUser(
  plan: string,
  populateDb: boolean,
  dataTypes: DataType[] = []
) {
  const userStore = useUserStore();

  const userInfo = {
    email: plan === "free" ? "free@example.com" : "pro@example.com",
    username: plan === "free" ? "FreeUser" : "ProUser",
    planTier: plan === "free" ? PlanTier.FREE : PlanTier.PRO,
  };
  userStore.setUser(userInfo);
  if (populateDb) {
    dataTypes.forEach((dataType) => loadDb(dataType));
  }
}

function processData(
  csvText: string,
  dataType: DataType
): (AZStandardizedData | USStandardizedData)[] {
  const rows = csvText.trim().split("\n");
  return rows.map((row) => {
    const columns = row.split(",");
    if (dataType === DBName.AZ) {
      const [destName, dialCode, rate] = columns;
      return {
        destName: destName.trim(),
        dialCode: Number(dialCode.trim()),
        rate: Number(rate.trim()),
      };
    } else if (dataType === DBName.US) {
      const [, npa, nxx, interRate, intraRate, ijRate] = columns;
      let processedNpa = npa.trim();
      if (processedNpa.startsWith("1") && processedNpa.length === 4) {
        processedNpa = processedNpa.slice(1);
      }
      return {
        npa: Number(processedNpa),
        nxx: Number(nxx.trim()),
        interRate: Number(interRate.trim()),
        intraRate: Number(intraRate.trim()),
        ijRate: Number(ijRate.trim()),
      };
    }
    throw new Error(`Unsupported data type: ${dataType}`);
  });
}

async function loadDb(dataType: DataType): Promise<void> {
  try {
    const dbName = dataType === DBName.AZ ? DBName.AZ : DBName.US;
    const db = await openDB(dbName, 1, {
      upgrade(db) {
        if (dataType === DBName.AZ) {
          db.createObjectStore("AZtest1.csv", {
            keyPath: "id",
            autoIncrement: true,
          });
          db.createObjectStore("AZtest2.csv", {
            keyPath: "id",
            autoIncrement: true,
          });
        } else if (dataType === DBName.US) {
          db.createObjectStore("npa_nxx.csv", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      },
    });

    const DBstore = useDBstate();

    if (dataType === DBName.AZ) {
      const responseFile1 = await fetch("/src/data/AZtest1.csv");
      const csvTextFile1 = await responseFile1.text();
      DBstore.addFileUploaded("az1", DBName.AZ, "AZtest1.csv");

      const responseFile2 = await fetch("/src/data/AZtest2.csv");
      const csvTextFile2 = await responseFile2.text();
      DBstore.addFileUploaded("az2", DBName.AZ, "AZtest2.csv");

      const dataFile1 = processData(csvTextFile1, DBName.AZ);
      await storeData(db, "AZtest1.csv", dataFile1);

      const dataFile2 = processData(csvTextFile2, DBName.AZ);
      await storeData(db, "AZtest2.csv", dataFile2);
    } else if (dataType === DBName.US) {
      const responseFile = await fetch("/src/data/npa_nxx.csv");
      const csvTextFile = await responseFile.text();
      DBstore.addFileUploaded("us1", DBName.US, "npa_nxx.csv");

      const dataFile = processData(csvTextFile, DBName.US);
      await storeData(db, "npa_nxx.csv", dataFile);
    }
  } catch (error) {
    console.error(`Error loading ${dataType} CSV into IndexedDB:`, error);
  }
}

async function storeData(
  db: IDBPDatabase,
  storeName: string,
  data: (AZData | USData)[]
): Promise<void> {
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);

  for (const item of data) {
    await store.put(item);
  }

  await tx.done;
}
