/// <reference lib="webworker" />

import { 
  LergEntry, 
  LergWorkerMessage, 
  LergWorkerResponse,
  LergError 
} from '@/types/lerg-types';

function createError(code: string, message: string, details?: unknown): LergError {
  return { code, message, details };
}

self.onmessage = async (event: MessageEvent<LergWorkerMessage>) => {
  if (event.data.type === 'process') {
    const { csvContent, chunkSize = 1000 } = event.data;
    
    try {
      if (!csvContent) {
        throw new Error('CSV_CONTENT_MISSING');
      }

      const rows = csvContent.trim().split('\n');
      if (rows.length === 0) {
        throw new Error('CSV_EMPTY');
      }

      const totalRows = rows.length;
      const chunks: LergEntry[][] = [];
      
      for (let i = 0; i < rows.length; i += chunkSize) {
        try {
          const chunk = rows.slice(i, i + chunkSize);
          const processedChunk = processLergChunk(chunk);
          chunks.push(processedChunk);
          
          const progressMessage: LergWorkerResponse = {
            type: 'progress',
            progress: Math.round((i / totalRows) * 100)
          };
          self.postMessage(progressMessage);
        } catch (chunkError) {
          console.error(`Error processing chunk ${i}-${i + chunkSize}:`, chunkError);
        }
      }
      
      const completeMessage: LergWorkerResponse = {
        type: 'complete',
        data: chunks.flat()
      };
      self.postMessage(completeMessage);
      
    } catch (error) {
      console.error('LERG processing error:', error);
      const errorMessage: LergWorkerResponse = {
        type: 'error',
        error: createError(
          (error instanceof Error) ? error.message : 'UNKNOWN_ERROR',
          'Failed to process LERG data',
          error
        )
      };
      self.postMessage(errorMessage);
    }
  }
};

function processLergChunk(rows: string[]): LergEntry[] {
  return rows
    .map((row, index) => {
      try {
        // Skip empty rows
        if (!row.trim()) {
          return null;
        }

        const [country, npanxx] = row.split(',').map(col => col.trim());
        
        // Validate required fields
        if (!country || !npanxx) {
          console.warn(`Row ${index} missing required fields:`, row);
          return null;
        }

        // Parse NPANXX with validation
        const parsedNpanxx = Number(npanxx);
        if (isNaN(parsedNpanxx)) {
          console.warn(`Row ${index} has invalid NPANXX:`, npanxx);
          return null;
        }

        return {
          country,
          npanxx: parsedNpanxx
        };

      } catch (rowError) {
        console.error(`Error processing row ${index}:`, rowError);
        return null;
      }
    })
    .filter((entry): entry is LergEntry => entry !== null);
}