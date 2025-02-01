import Papa from 'papaparse';
import type { LERGRecord, LergWorkerResponse } from '@/types/lerg-types';

type WorkerMessageType = {
  type: 'process' | 'initialize';
  file?: File;
  batchSize?: number;
  data?: any;
};

self.onmessage = async (event: MessageEvent<WorkerMessageType>) => {
  switch (event.data.type) {
    case 'process':
      if (!event.data.file) {
        throw new Error('No file provided for processing');
      }
      await processFile(event.data.file, event.data.batchSize || 1000);
      break;

    case 'initialize':
      // Handle initialization tasks
      break;

    default:
      throw new Error(`Unknown worker message type: ${event.data.type}`);
  }
};

async function processFile(file: File, batchSize: number) {
  const text = await file.text();
  const { data } = Papa.parse(text, { header: true });
  const records: LERGRecord[] = [];
  const total = data.length;
  let processed = 0;

  for (let i = 0; i < total; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const transformedBatch = batch.map((row: any) => ({
      npanxx: `${row.npa}${row.nxx}`,
      state: row.state,
      npa: row.npa,
      nxx: row.nxx,
    }));
    records.push(...transformedBatch);
    processed += batch.length;

    // Report progress
    self.postMessage({
      type: 'progress',
      progress: Math.round((processed / total) * 100),
      processed,
      total,
    } as LergWorkerResponse);
  }

  // Send completed data
  self.postMessage({
    type: 'complete',
    data: records,
    progress: 100,
    processed: total,
    total,
  } as LergWorkerResponse);
}

export {}; // Make this a module
