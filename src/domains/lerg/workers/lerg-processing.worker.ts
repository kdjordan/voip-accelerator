import Papa from 'papaparse';
import type { LERGRecord, LERGProcessingResult } from '../types/types';

interface WorkerMessage {
  type: 'process';
  file: File;
  batchSize: number;
}

interface WorkerResponse {
  type: 'progress' | 'complete' | 'error';
  data?: LERGProcessingResult;
  progress?: number;
  error?: string;
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  if (event.data.type === 'process') {
    try {
      await processFile(event.data.file, event.data.batchSize);
    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
};

async function processFile(file: File, batchSize: number = 1000): Promise<void> {
  let processedRows = 0;
  let totalRows = 0;

  Papa.parse(file, {
    skipEmptyLines: true,
    delimiter: '|',
    chunk: async (results, parser) => {
      parser.pause();

      const validRecords: LERGRecord[] = [];
      const errors: string[] = [];

      for (const row of results.data as string[][]) {
        const record = validateAndTransformRow(row);
        if (record) {
          validRecords.push(record);
        }
      }

      processedRows += results.data.length;
      totalRows = processedRows;

      // Report progress
      self.postMessage({
        type: 'progress',
        progress: (processedRows / file.size) * 100,
        data: {
          records: validRecords,
          totalProcessed: processedRows,
          errors,
        },
      });

      // Process this chunk
      try {
        // In a real implementation, we'd batch these to the server
        // await uploadBatch(validRecords);
        parser.resume();
      } catch (error) {
        parser.abort();
        throw error;
      }
    },
    complete: () => {
      self.postMessage({
        type: 'complete',
        data: {
          records: [],
          totalProcessed: totalRows,
          errors: [],
        },
      });
    },
    error: error => {
      throw new Error(`Failed to parse LERG file: ${error.message}`);
    },
  });
}

function validateAndTransformRow(row: string[]): LERGRecord | null {
  try {
    const npa = row[0]?.trim();
    const nxx = row[1]?.trim();
    const state = row[2]?.trim();

    if (!npa || !nxx || !state) {
      throw new Error('Missing required fields');
    }

    if (!/^\d{3}$/.test(npa)) {
      throw new Error('Invalid NPA format');
    }

    if (!/^\d{3}$/.test(nxx)) {
      throw new Error('Invalid NXX format');
    }

    if (!/^[A-Z]{2}$/.test(state)) {
      throw new Error('Invalid state format');
    }

    return { npa, nxx, state };
  } catch (error) {
    console.error('Row validation failed:', error);
    return null;
  }
}
