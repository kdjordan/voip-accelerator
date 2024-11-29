import AzComparisonWorker from '@/workers/az/az-comparison.worker?worker';
import { type AZReportsInput, type AzPricingReport, type AzCodeReport, DBName } from '@/types/app-types';
import { useDBstate } from '@/stores/dbStore';

export async function resetReportApi(reportType: string) {
  await deleteDbApi(reportType);
  const dbStore = useDBstate();
  dbStore.resetAzReportInStore();
}

async function deleteDbApi(dbName: string) {
  try {
    await deleteIndexedDBDatabase(dbName);
  } catch (e) {
    console.log(`Error resetting ${dbName} pricing report `, e);
  }
}

export async function makeAzReportsApi(
  input: AZReportsInput
): Promise<{ pricingReport: AzPricingReport; codeReport: AzCodeReport }> {
  const worker = new AzComparisonWorker();

  worker.postMessage(input);

  return new Promise((resolve, reject) => {
    worker.onmessage = event => {
      const { pricingReport, codeReport } = event.data;
      resolve({ pricingReport, codeReport });
    };

    worker.onerror = error => {
      console.error('Error from worker:', error);
      reject(error);
    };
  });
}

function forceRefreshApi() {
  window.location.reload();
}

export async function deleteIndexedDBDatabase(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);
    
    request.onerror = () => {
      console.error(`Error deleting database: ${dbName}`);
      reject(new Error(`Failed to delete database: ${dbName}`));
    };
    
    request.onsuccess = () => {
      console.log(`Successfully deleted database: ${dbName}`);
      resolve();
    };
  });
}
