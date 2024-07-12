import { deleteIndexedDBDatabase } from '@/utils/resetIndexDb';
import ComparisonWorker from '@/workers/comparison.worker?worker';
import { type PricingReportInput, type ComparisonReport } from '../../types/app-types';


export async function resetReportApi(reportType: string) {
  await delteDb(reportType)

}

async function delteDb(dbName: string) {
  try {
    await deleteIndexedDBDatabase(dbName)
  } catch (e) {
    console.log(`Error resetting ${dbName} pricing report `, e)
  }
}

export async function deleteAllDbs(theDbs: string[]) {
  try {
    theDbs.forEach(db => {
      deleteIndexedDBDatabase(db)
    })
  } catch (e) {
    console.log(`error deleting db in API`, e)
  }
  forceRefreshApi()
}

export async function makePricingReportApi(input: PricingReportInput): Promise<ComparisonReport>{
  
  const worker = new ComparisonWorker();

  	worker.postMessage(input);
  
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      const comparisonReport: ComparisonReport = event.data;
      resolve(comparisonReport); // Resolve the promise with the comparison report
    };

    worker.onerror = (error) => {
      console.error('Error from worker:', error);
      reject(error); // Reject the promise if an error occurs
    };

  });
  
}

function forceRefreshApi() {
  window.location.reload();
}