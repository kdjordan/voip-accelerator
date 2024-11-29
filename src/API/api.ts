import { deleteIndexedDBDatabase } from '@/utils/resetIndexDb';
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

export async function deleteAllDbsApi(theDbs: string[]) {
  try {
    for (const db of theDbs) {
      await deleteIndexedDBDatabase(db);
    }
  } catch (e) {
    console.log(`error deleting db in API`, e);
  }
  forceRefreshApi();
}

export async function makeAzReportsApi(input: AZReportsInput): Promise<{ pricingReport: AzPricingReport, codeReport: AzCodeReport }> {
  const worker = new AzComparisonWorker();

  worker.postMessage(input);

  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      const { pricingReport, codeReport } = event.data;
      resolve({ pricingReport, codeReport });
    };

    worker.onerror = (error) => {
      console.error('Error from worker:', error);
      reject(error);
    };
  });
}

function forceRefreshApi() {
  window.location.reload();
}

