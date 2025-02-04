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

interface ParsedRow {
  [key: number]: string;
}

const REQUIRED_LENGTH = 14; // Number of columns in LERG file
const BATCH_SIZE = 1000;

async function processFile(file: File, batchSize: number) {
  const text = await file.text();
  let totalRows = 0;
  let validRows = 0;
  let duplicates = 0;
  const validRecords: LERGRecord[] = [];
  const seen = new Set<string>();

  // Configure Papa Parse
  const parseConfig = {
    delimiter: ',',
    skipEmptyLines: true,
    header: false,
    step: (results: Papa.ParseStepResult<ParsedRow>, parser: Papa.Parser) => {
      totalRows++;
      const row = results.data;

      if (totalRows === 1) {
        console.log('🔄 Worker processing first row:', row);
      }

      // Validate row structure
      if (Object.keys(row).length !== REQUIRED_LENGTH) {
        console.warn('❌ Invalid row length:', { expected: REQUIRED_LENGTH, got: Object.keys(row).length });
        return;
      }

      // Extract and validate fields
      const npa = row[0]?.trim();
      const nxx = row[1]?.trim();
      const state = row[3]?.trim();

      if (!isValidNPA(npa) || !isValidNXX(nxx) || !isValidState(state)) {
        console.warn('Invalid field data:', { npa, nxx, state });
        return;
      }

      const npanxx = `${npa}${nxx}`;
      if (seen.has(npanxx)) {
        duplicates++;
        return;
      }

      seen.add(npanxx);
      validRows++;
      validRecords.push({
        npa,
        nxx,
        npanxx,
        state,
      });

      // Report progress every BATCH_SIZE rows
      if (validRows % BATCH_SIZE === 0) {
        self.postMessage({
          type: 'progress',
          progress: Math.round((totalRows / file.size) * 100),
          processed: validRows,
          total: totalRows,
          duplicates,
        } as LergWorkerResponse);
      }
    },
    complete: () => {
      self.postMessage({
        type: 'complete',
        progress: 100,
        processed: validRows,
        total: totalRows,
        duplicates,
        data: validRecords,
      } as LergWorkerResponse);
    },
    error: (error: Error) => {
      self.postMessage({
        type: 'error',
        error: error.message,
      } as LergWorkerResponse);
    },
  };

  Papa.parse(text, parseConfig);
}

function isValidNPA(npa: string): boolean {
  return /^\d{3}$/.test(npa);
}

function isValidNXX(nxx: string): boolean {
  return /^\d{3}$/.test(nxx);
}

function isValidState(state: string): boolean {
  return /^[A-Z]{2}$/.test(state);
}

export {}; // Make this a module
