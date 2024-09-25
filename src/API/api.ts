import { deleteIndexedDBDatabase } from '@/utils/resetIndexDb';
import AzComparisonWorker from '@/workers/az/az-comparison.worker?worker';
import AzPricingWorker from '@/workers/az/az-comparison.worker?worker';
import { type AZReportsInput, type AzPricingReport, type AzCodeReport } from '../../types/app-types';


export async function resetReportApi(reportType: string) {
  await deleteDbApi(reportType)
}

async function deleteDbApi(dbName: string) {
  try {
    await deleteIndexedDBDatabase(dbName)
  } catch (e) {
    console.log(`Error resetting ${dbName} pricing report `, e)
  }
}

export async function deleteAllDbsApi(theDbs: string[]) {
  try {
    theDbs.forEach(db => {
      deleteIndexedDBDatabase(db)
    })
  } catch (e) {
    console.log(`error deleting db in API`, e)
  }
  forceRefreshApi()
}

export async function makeAzPricingReportApi(input: AZReportsInput): Promise<AzPricingReport> {

  const worker = new AzComparisonWorker();

  worker.postMessage(input);

  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      const comparisonReport: AzPricingReport = event.data;
      resolve(comparisonReport); // Resolve the promise with the comparison report
    };

    worker.onerror = (error) => {
      console.error('Error from worker:', error);
      reject(error); // Reject the promise if an error occurs
    };

  });
}

export async function makeAzCodeReportApi(input: AZReportsInput): Promise<AzCodeReport> {
  console.log('makeAzCodeReportApi', input)
  const worker = new AzComparisonWorker();

  worker.postMessage(input);

  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      const codeReport: AzCodeReport = event.data;
      resolve(codeReport);
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