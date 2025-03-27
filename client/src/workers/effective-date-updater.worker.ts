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

  // Fix: Use locale-aware date formatting to preserve the local date
  // Format: YYYY-MM-DD
  const year = effectiveDate.getFullYear();
  const month = String(effectiveDate.getMonth() + 1).padStart(2, '0');
  const day = String(effectiveDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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
    // First, consolidate data by destination to ensure consistent change codes
    const destinationChangeCodeMap = new Map<string, ChangeCodeType>();

    // First pass: collect all destination names and determine the primary change code for each
    for (const group of input.rawGroupedData) {
      const { destinationName, changeCode } = group;

      // Use a priority system for change codes when there are conflicts
      // Priority: INCREASE > DECREASE > SAME
      if (
        !destinationChangeCodeMap.has(destinationName) ||
        changeCode === ChangeCode.INCREASE ||
        (changeCode === ChangeCode.DECREASE &&
          destinationChangeCodeMap.get(destinationName) === ChangeCode.SAME)
      ) {
        destinationChangeCodeMap.set(destinationName, changeCode);
      }
    }

    // Apply effective dates based on consolidated change codes
    let preparedGroupedData: {
      destinationName: string;
      effectiveDate: string;
      changeCode: ChangeCodeType;
    }[] = [];

    // Keep track of processed destinations to avoid duplicates
    const processedDestinations = new Set<string>();

    const total = input.rawGroupedData.length;
    let processedCount = 0;

    // Process in chunks to provide progress updates
    const chunkSize = Math.max(1, Math.floor(total / 20)); // Split into ~20 chunks for reporting

    for (let i = 0; i < total; i += chunkSize) {
      const endIndex = Math.min(i + chunkSize, total);
      const chunk = input.rawGroupedData.slice(i, endIndex);

      for (const group of chunk) {
        const { destinationName } = group;

        // Only process each destination once to ensure consistency
        if (!processedDestinations.has(destinationName)) {
          // Use the consolidated change code for this destination
          const consolidatedChangeCode =
            destinationChangeCodeMap.get(destinationName) || group.changeCode;
          const newEffectiveDate = calculateEffectiveDate(
            consolidatedChangeCode,
            input.effectiveDateSettings
          );

          preparedGroupedData.push({
            destinationName,
            effectiveDate: newEffectiveDate,
            changeCode: consolidatedChangeCode,
          });

          processedDestinations.add(destinationName);

          // Verbose logging for debugging
          console.log(
            `Destination: ${destinationName}, ChangeCode: ${consolidatedChangeCode}, EffectiveDate: ${newEffectiveDate}`
          );
        }
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

    // Create maps for faster lookups
    const effectiveDateMap = new Map<string, string>();
    const changeCodeMap = new Map<string, ChangeCodeType>();

    for (const group of preparedGroupedData) {
      effectiveDateMap.set(group.destinationName, group.effectiveDate);
      changeCodeMap.set(group.destinationName, group.changeCode);
    }

    // STEP 2: PROCESS RECORDS
    // Find records that need updating
    const updatedRecords: { name: string; prefix: string; effective: string }[] = [];
    let recordsProcessed = 0;
    let recordsUpdatedCount = 0;

    // Group records by destination name to ensure consistent updates
    const recordsByDestination = new Map<
      string,
      { name: string; prefix: string; effective: string }[]
    >();

    // First pass: group records by destination name
    for (const record of input.allRecords) {
      if (!recordsByDestination.has(record.name)) {
        recordsByDestination.set(record.name, []);
      }
      recordsByDestination.get(record.name)!.push(record);
    }

    // Process in medium-sized batches for balance between performance and UI updates
    const destinationNames = Array.from(recordsByDestination.keys());

    for (let i = 0; i < destinationNames.length; i += 50) {
      const endIndex = Math.min(i + 50, destinationNames.length);
      const destinationBatch = destinationNames.slice(i, endIndex);

      // Report progress (50-90%)
      const percentage = 50 + Math.floor((i / destinationNames.length) * 40);
      self.postMessage({
        type: 'progress',
        processedCount: i,
        totalCount: destinationNames.length,
        percentage,
        recordsUpdatedCount,
        currentDestination: destinationBatch[0] || '',
        phase: 'processing',
        detail: `Processing destinations: ${i}/${destinationNames.length}`,
      });

      // Process each destination in this batch
      for (const destinationName of destinationBatch) {
        const records = recordsByDestination.get(destinationName) || [];
        const newEffectiveDate = effectiveDateMap.get(destinationName);
        const consolidatedChangeCode = changeCodeMap.get(destinationName);

        if (newEffectiveDate) {
          // Update all records for this destination with the same effective date
          let updatedAnyForDestination = false;

          for (const record of records) {
            if (record.effective !== newEffectiveDate) {
              updatedRecords.push({
                name: record.name,
                prefix: record.prefix,
                effective: newEffectiveDate,
              });
              recordsUpdatedCount++;
              updatedAnyForDestination = true;
            }
          }

          // Log detailed updates for debugging
          if (updatedAnyForDestination) {
            console.log(
              `Updated ${records.length} records for destination "${destinationName}" with effective date ${newEffectiveDate} and change code ${consolidatedChangeCode}`
            );
          }
        }

        recordsProcessed += records.length;
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

    await takeBreath();

    // Calculate processing time and return result
    const processingTimeMs = Date.now() - startTime;
    console.log(
      `Worker completed: ${recordsUpdatedCount} of ${input.allRecords.length} records updated in ${
        processingTimeMs / 1000
      }s`
    );

    // Return the updated records and any other necessary data
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
      phase: 'unknown',
    });
  }
});
