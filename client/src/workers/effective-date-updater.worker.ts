import type { 
  GroupedRateData, 
  RateSheetRecord,
  ChangeCodeType
} from '@/types/domains/rate-sheet-types';
import { ChangeCode } from '@/types/domains/rate-sheet-types';

// Input interface for the worker - now receiving simplified data
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
  effectiveDateSettings: {
    same: string;
    increase: string;
    decrease: string;
    sameCustomDate: string;
    increaseCustomDate: string;
    decreaseCustomDate: string;
  };
}

// Result interface from the worker
interface EffectiveDateUpdateResult {
  type: 'result';
  updatedRecords: SimplifiedRecord[];
  recordsUpdatedCount: number;
  updatedGroupedData: SimplifiedGroupData[]; // Return the updated grouped data
}

// Simplified interfaces for worker communication to avoid cloning issues
interface SimplifiedGroupData {
  destinationName: string;
  effectiveDate: string;
  changeCode: ChangeCodeType;
}

// Even simpler interfaces to prevent cloning issues
interface SimplifiedRecord {
  name: string;
  prefix: string;
  effective: string;
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
  detail?: string; // Additional context about the current operation
}

// Error notification
interface ErrorMessage {
  type: 'error';
  message: string;
  phase?: string; // Which phase the error occurred in
}

// Define all possible message types
type WorkerMessage = EffectiveDateUpdateResult | ProgressUpdate | ErrorMessage;

// Safe way to post messages to avoid cloning errors
function safePostMessage(message: WorkerMessage) {
  try {
    self.postMessage(message);
  } catch (error) {
    console.error('Error posting message from worker:', error);
    // Try to send a simplified error message
    try {
      self.postMessage({
        type: 'error',
        message: `Failed to send worker message: ${error instanceof Error ? error.message : String(error)}`
      });
    } catch (e) {
      // Last resort if even that fails
      self.postMessage({
        type: 'error',
        message: 'Critical error in worker communication'
      });
    }
  }
}

// Calculate effective date based on change code and settings
function calculateEffectiveDate(changeCode: ChangeCodeType, settings: EffectiveDateUpdateInput['effectiveDateSettings']): string {
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

// Give the worker a chance to "breathe" and update the UI
async function takeBreath() {
  return new Promise(resolve => setTimeout(resolve, 10));
}

// Listen for messages from the main thread
self.addEventListener('message', async event => {
  try {
    console.log('Worker received message');
    const startTime = Date.now();
    const input = event.data as EffectiveDateUpdateInput;

    if (!input.rawGroupedData || !input.allRecords || !input.effectiveDateSettings) {
      throw new Error('Missing required data for effective date update');
    }

    console.log(`Worker received ${input.rawGroupedData.length} groups and ${input.allRecords.length} records`);
    
    // Send initial progress update
    safePostMessage({
      type: 'progress',
      processedCount: 0,
      totalCount: 100, // Using percentage for preparation phase
      percentage: 0,
      recordsUpdatedCount: 0,
      phase: 'preparing',
      detail: 'Initializing data preparation...'
    });

    await takeBreath();

    try {
      // STEP 1: PREPARE THE DATA (previously done in the main thread)
      // --------------------------------------------------------
      safePostMessage({
        type: 'progress',
        processedCount: 5,
        totalCount: 100,
        percentage: 5,
        recordsUpdatedCount: 0,
        phase: 'preparing',
        detail: `Preparing ${input.rawGroupedData.length} destination groups...`
      });
      
      await takeBreath();
      
      // Apply effective dates based on change code
      let preparedGroupedData: SimplifiedGroupData[] = [];
      let count = 0;
      let sameCount = 0, increaseCount = 0, decreaseCount = 0;
      
      // Process in chunks to allow progress reporting
      const chunkSize = Math.max(1, Math.floor(input.rawGroupedData.length / 20)); // Split into ~20 chunks for reporting
      
      for (let i = 0; i < input.rawGroupedData.length; i += chunkSize) {
        const endIndex = Math.min(i + chunkSize, input.rawGroupedData.length);
        const chunk = input.rawGroupedData.slice(i, endIndex);
        
        for (const item of chunk) {
          const changeCode = item.changeCode as ChangeCodeType;
          const newEffectiveDate = calculateEffectiveDate(changeCode, input.effectiveDateSettings);
          
          // Create simplified version of the group data
          preparedGroupedData.push({
            destinationName: item.destinationName,
            effectiveDate: newEffectiveDate,
            changeCode: changeCode
          });
          
          // Count by type for reporting
          if (changeCode === ChangeCode.SAME) sameCount++;
          else if (changeCode === ChangeCode.INCREASE) increaseCount++;
          else if (changeCode === ChangeCode.DECREASE) decreaseCount++;
        }
        
        count += chunk.length;
        
        // Calculate progress as a percentage of preparation
        const prepProgress = Math.round((count / input.rawGroupedData.length) * 40) + 5; // 5-45%
        
        // Report progress
        safePostMessage({
          type: 'progress',
          processedCount: prepProgress,
          totalCount: 100,
          percentage: prepProgress,
          recordsUpdatedCount: 0,
          phase: 'preparing',
          detail: `Preparing data: ${count}/${input.rawGroupedData.length} groups processed`
        });
        
        // Take a breath every chunk to allow UI updates
        await takeBreath();
      }
      
      // Report breakdown of change types
      safePostMessage({
        type: 'progress',
        processedCount: 45,
        totalCount: 100,
        percentage: 45,
        recordsUpdatedCount: 0,
        phase: 'preparing',
        detail: `Applied effective dates: ${sameCount} same, ${increaseCount} increase, ${decreaseCount} decrease`
      });
      
      await takeBreath();
      
      // Create destination name to effective date map for faster lookups
      safePostMessage({
        type: 'progress',
        processedCount: 50,
        totalCount: 100,
        percentage: 50,
        recordsUpdatedCount: 0,
        phase: 'preparing',
        detail: 'Creating lookup maps...'
      });
      
      const nameToEffectiveDateMap = new Map<string, string>();
      for (const group of preparedGroupedData) {
        nameToEffectiveDateMap.set(group.destinationName, group.effectiveDate);
      }
      
      await takeBreath();
      
      // STEP 2: PROCESSING RECORDS (already in worker)
      // --------------------------------------------------------
      safePostMessage({
        type: 'progress',
        processedCount: 0,
        totalCount: preparedGroupedData.length,
        percentage: 50,
        recordsUpdatedCount: 0,
        phase: 'processing',
        detail: `Starting to process ${input.allRecords.length} records across ${preparedGroupedData.length} destinations`
      });
      
      await takeBreath();
      
      // Process the update
      const total = preparedGroupedData.length;
      let processedCount = 0;
      let recordsUpdatedCount = 0;
      const updatedRecords: SimplifiedRecord[] = [];
      
      // We'll process records in smaller batches
      const BATCH_SIZE = 5000;
      
      // Process in small chunks
      for (let i = 0; i < input.allRecords.length; i += BATCH_SIZE) {
        const endIndex = Math.min(i + BATCH_SIZE, input.allRecords.length);
        const recordChunk = input.allRecords.slice(i, endIndex);
        
        // Find all destinations in this chunk
        const destinationsInChunk = new Set<string>();
        for (const record of recordChunk) {
          destinationsInChunk.add(record.name);
        }
        
        // Track current position in destination list for progress reporting
        const destinationsList = Array.from(destinationsInChunk);
        let lastReportedDestination = '';
        
        // Process records in the batch
        for (const record of recordChunk) {
          const effectiveDate = nameToEffectiveDateMap.get(record.name);
          if (effectiveDate && record.effective !== effectiveDate) {
            // Only store minimal data needed for updates
            updatedRecords.push({
              name: record.name,
              prefix: record.prefix,
              effective: effectiveDate
            });
            recordsUpdatedCount++;
          }
          
          // For progress reporting, we'll use the destination we're currently processing
          const destination = record.name;
          if (destination !== lastReportedDestination) {
            lastReportedDestination = destination;
            const destinationIndex = destinationsList.indexOf(destination);
            if (destinationIndex >= 0) {
              processedCount = Math.min(processedCount + 1, total);
              
              // Calculate time metrics for progress updates
              const elapsedMs = Date.now() - startTime;
              const msPerItem = processedCount > 0 ? elapsedMs / processedCount : 0;
              const remainingItems = total - processedCount;
              const estimatedTimeRemaining = msPerItem > 0 ? Math.round((remainingItems * msPerItem) / 1000) : undefined;
              
              // Send progress update for each 1% or at least every 10 items
              const percentage = Math.round((processedCount / total) * 100);
              const overallProgress = Math.round(50 + (percentage / 2)); // Map to 50-100% range
              
              if (processedCount % Math.max(1, Math.floor(total * 0.01)) === 0) {
                safePostMessage({
                  type: 'progress',
                  processedCount,
                  totalCount: total,
                  percentage: overallProgress,
                  recordsUpdatedCount,
                  currentDestination: destination,
                  phase: 'processing',
                  estimatedTimeRemaining,
                  detail: `Processing ${destination}: ${recordsUpdatedCount} records updated so far`
                });
                
                // Take a breath every 1% of progress
                if (processedCount % Math.max(1, Math.floor(total * 0.05)) === 0) {
                  await takeBreath();
                }
              }
            }
          }
        }
        
        // Give the browser a chance to breathe between batches
        await takeBreath();
      }
      
      // Send one final progress update
      safePostMessage({
        type: 'progress',
        processedCount: total,
        totalCount: total,
        percentage: 100,
        recordsUpdatedCount,
        phase: 'finalizing',
        detail: `Finalizing ${recordsUpdatedCount} record updates...`
      });
      
      console.log(`Worker completed: ${recordsUpdatedCount} records updated out of ${input.allRecords.length} total`);
      
      // Send final result with just the minimal data needed
      safePostMessage({
        type: 'result',
        updatedRecords,
        recordsUpdatedCount,
        updatedGroupedData: preparedGroupedData
      });
      
    } catch (error) {
      console.error('Worker processing error:', error);
      safePostMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : String(error),
        phase: 'processing'
      });
    }
  } catch (error) {
    console.error('Worker error:', error);
    safePostMessage({ 
      type: 'error', 
      message: error instanceof Error ? error.message : String(error),
      phase: 'initialization'
    });
  }
}); 