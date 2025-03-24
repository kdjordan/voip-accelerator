import type { ChangeCodeType, EffectiveDateStoreSettings } from '@/types/domains/rate-sheet-types';
import { ChangeCode } from '@/types/domains/rate-sheet-types';

// Input interface for the worker - simplified data
interface EffectiveDateUpdateInput {
  // Simplified grouped data with just the necessary properties
  rawGroupedData: {
    destinationName: string;
    changeCode: ChangeCodeType;
    effectiveDate: string;
  }[];

  // Simplified records
  allRecords: {
    name: string;
    prefix: string;
    effective: string;
  }[];

  // Effective date settings
  effectiveDateSettings: EffectiveDateStoreSettings;
}

// Result interface from the worker - simplified for direct application to the store
interface EffectiveDateUpdateResult {
  type: 'result';
  updatedRecords: {
    name: string;
    prefix: string;
    effective: string;
  }[];
  recordsUpdatedCount: number;
  updatedGroupedData: {
    destinationName: string;
    effectiveDate: string;
    changeCode: ChangeCodeType;
  }[];
}

// Progress notification with enhanced details
interface ProgressUpdate {
  type: 'progress';
  processedCount: number;
  totalCount: number;
  percentage: number;
  recordsUpdatedCount: number;
  currentDestination?: string;
  phase: 'preparing' | 'processing' | 'finalizing';
  estimatedTimeRemaining?: number;
  detail?: string;
}

// Error notification
interface ErrorMessage {
  type: 'error';
  message: string;
  phase?: string;
}

// Define all possible message types
type WorkerMessage = EffectiveDateUpdateResult | ProgressUpdate | ErrorMessage;

// Calculate effective date based on change code and settings
function calculateEffectiveDate(
  changeCode: ChangeCodeType,
  settings: EffectiveDateUpdateInput['effectiveDateSettings']
): string {
  const today = new Date();
  let effectiveDate = today;

  if (changeCode === ChangeCode.SAME) {
    if (settings.same === 'today') {
      effectiveDate = today;
    } else if (settings.same === 'tomorrow') {
      effectiveDate = new Date(today);
      effectiveDate.setDate(today.getDate() + 1);
    } else if (settings.same === 'custom') {
      return settings.sameCustomDate;
    }
  } else if (changeCode === ChangeCode.INCREASE) {
    if (settings.increase === 'today') {
      effectiveDate = today;
    } else if (settings.increase === 'tomorrow') {
      effectiveDate = new Date(today);
      effectiveDate.setDate(today.getDate() + 1);
    } else if (settings.increase === 'week') {
      effectiveDate = new Date(today);
      effectiveDate.setDate(today.getDate() + 7);
    } else if (settings.increase === 'custom') {
      return settings.increaseCustomDate;
    }
  } else if (changeCode === ChangeCode.DECREASE) {
    if (settings.decrease === 'today') {
      effectiveDate = today;
    } else if (settings.decrease === 'tomorrow') {
      effectiveDate = new Date(today);
      effectiveDate.setDate(today.getDate() + 1);
    } else if (settings.decrease === 'custom') {
      return settings.decreaseCustomDate;
    }
  }

  return effectiveDate.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Give the worker a chance to breathe - use a moderate delay for proper UI updates
async function takeBreath() {
  // Use a 25ms delay to ensure UI updates have time to render
  return new Promise((resolve) => setTimeout(resolve, 25));
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  try {
    console.log('Worker received message');
    const startTime = Date.now();
    const input = event.data as EffectiveDateUpdateInput;

    if (!input.rawGroupedData || !input.allRecords || !input.effectiveDateSettings) {
      throw new Error('Missing required data for effective date update');
    }

    console.log(
      `Worker received ${input.rawGroupedData.length} groups and ${input.allRecords.length} records`
    );

    // Send initial progress update
    self.postMessage({
      type: 'progress',
      processedCount: 0,
      totalCount: 100,
      percentage: 0,
      recordsUpdatedCount: 0,
      phase: 'preparing',
      detail: 'Initializing data preparation...',
    });

    await takeBreath();

    // STEP 1: PREPARE THE DATA
    // Apply effective dates based on change code
    let preparedGroupedData: {
      destinationName: string;
      effectiveDate: string;
      changeCode: ChangeCodeType;
    }[] = [];

    const total = input.rawGroupedData.length;
    let processedCount = 0;

    // Process in chunks to provide progress updates
    const chunkSize = Math.max(1, Math.floor(total / 20)); // Split into ~20 chunks for reporting

    for (let i = 0; i < total; i += chunkSize) {
      const endIndex = Math.min(i + chunkSize, total);
      const chunk = input.rawGroupedData.slice(i, endIndex);

      for (const group of chunk) {
        const changeCode = group.changeCode;
        const newEffectiveDate = calculateEffectiveDate(changeCode, input.effectiveDateSettings);

        preparedGroupedData.push({
          destinationName: group.destinationName,
          effectiveDate: newEffectiveDate,
          changeCode,
        });
      }

      processedCount += chunk.length;

      // Report progress (0-50%)
      const percentage = Math.floor((processedCount / total) * 50);
      self.postMessage({
        type: 'progress',
        processedCount,
        totalCount: total,
        percentage,
        recordsUpdatedCount: 0,
        phase: 'preparing',
        detail: `Calculating effective dates: ${processedCount}/${total}`,
      });

      await takeBreath();
    }

    // Create a map for faster lookups
    const effectiveDateMap = new Map<string, string>();
    for (const group of preparedGroupedData) {
      effectiveDateMap.set(group.destinationName, group.effectiveDate);
    }

    // STEP 2: PROCESS RECORDS
    // Find records that need updating
    const updatedRecords: { name: string; prefix: string; effective: string }[] = [];
    let recordsProcessed = 0;
    let recordsUpdatedCount = 0;

    // Process in medium-sized batches for balance between performance and UI updates
    for (let i = 0; i < input.allRecords.length; i += 1000) {
      const endIndex = Math.min(i + 1000, input.allRecords.length);
      const recordsBatch = input.allRecords.slice(i, endIndex);

      // Report progress (50-90%)
      const percentage = 50 + Math.floor((i / input.allRecords.length) * 40);
      self.postMessage({
        type: 'progress',
        processedCount: i,
        totalCount: input.allRecords.length,
        percentage,
        recordsUpdatedCount,
        currentDestination: recordsBatch[0]?.name || '',
        phase: 'processing',
        detail: `Processing records: ${i}/${input.allRecords.length}`,
      });

      // Process this batch
      for (const record of recordsBatch) {
        const newEffectiveDate = effectiveDateMap.get(record.name);

        if (newEffectiveDate && record.effective !== newEffectiveDate) {
          updatedRecords.push({
            name: record.name,
            prefix: record.prefix,
            effective: newEffectiveDate,
          });
          recordsUpdatedCount++;
        }

        recordsProcessed++;
      }

      await takeBreath();
    }

    // Send final progress update
    self.postMessage({
      type: 'progress',
      processedCount: input.allRecords.length,
      totalCount: input.allRecords.length,
      percentage: 100,
      recordsUpdatedCount,
      phase: 'finalizing',
      detail: `Finalizing ${recordsUpdatedCount} record updates...`,
    });

    // Send the result
    self.postMessage({
      type: 'result',
      updatedRecords,
      recordsUpdatedCount,
      updatedGroupedData: preparedGroupedData,
    });
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
      phase: 'processing',
    });
  }
});
