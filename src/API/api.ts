import { AZReportsInput } from '@/domains/az/types/az-types';
import AzComparisonWorker from '@/domains/az/workers/az-comparison.worker?worker';
import type { AzPricingReport, AzCodeReport } from '@/domains/az/types/az-types';
import type { USReportPayload, USReportResponse } from '@/domains/npanxx/types/us-types';

export async function resetReportApi(reportType: string) {
  await deleteDbApi(reportType);
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

export async function makeNpanxxReportsApi(payload: USReportPayload): Promise<USReportResponse> {
  try {
    const response = await fetch('/api/npanxx/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to generate NPANXX reports');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in makeNpanxxReportsApi:', error);
    throw error;
  }
}
