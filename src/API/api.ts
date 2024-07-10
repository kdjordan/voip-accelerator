import { deleteIndexedDBDatabase } from '@/utils/resetIndexDb';
import ComparisonWorker from '@/workers/comparison.worker?worker';
import { type ComparisonReport } from '../../types/app-types';


export async function resetReport(reportType: string) {
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
  forceRefresh()
}

export async function makePricingReport(file1: any, file2: any ): Promise<ComparisonReport>{
  const worker = new ComparisonWorker();

  	worker.postMessage({ file1, file2 });
  
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

function forceRefresh() {
  window.location.reload();
}