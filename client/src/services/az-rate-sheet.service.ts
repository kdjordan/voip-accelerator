import { ChangeCode } from '@/types/domains/rate-sheet-types';
import type {
  RateSheetRecord,
  GroupedRateData,
  RateStatistics,
  InvalidRow,
  ChangeCodeType,
} from '@/types/domains/rate-sheet-types';
import { useAzRateSheetStore } from '@/stores/az-rate-sheet-store';
import Papa from 'papaparse';
import { UploadStage } from '@/types/components/upload-progress-types';

export class RateSheetService {
  private store = useAzRateSheetStore();

  // Pre-compiled regex patterns for performance
  private static readonly RATE_PATTERN = /^\d+(\.\d+)?$/;
  private static readonly PREFIX_PATTERN = /^[0-9+\-\s]*$/;

  constructor() {
    console.log('Initializing Rate Sheet service - using in-memory storage only');
  }

  async clearData(): Promise<void> {
    try {
      this.store.clearData();
    } catch (error) {
      console.error('Failed to clear rate sheet data:', error);
      throw error;
    }
  }

  async getRateSheetData(): Promise<RateSheetRecord[]> {
    try {
      return this.store.originalData;
    } catch (error) {
      console.error('Failed to get rate sheet data:', error);
      throw error;
    }
  }

  async updateEffectiveDates(groupedData: GroupedRateData[]): Promise<void> {
    try {
      console.log('Starting updateEffectiveDates with', groupedData.length, 'groups');

      // Get all records from the store
      const records = this.store.originalData;

      // Create a map for efficient lookup
      const recordsMap = new Map<string, RateSheetRecord[]>();

      // Group records by destination name
      records.forEach((record) => {
        const existing = recordsMap.get(record.name) || [];
        existing.push(record);
        recordsMap.set(record.name, existing);
      });

      // Prepare updates
      const updatedRecords: { name: string; prefix: string; effective: string }[] = [];

      // Update effective dates based on grouped data
      for (const group of groupedData) {
        const recordsForDestination = recordsMap.get(group.destinationName) || [];
        console.log(
          `Processing ${recordsForDestination.length} records for ${group.destinationName} with effective date ${group.effectiveDate}`
        );

        // Apply new effective date to all records for this destination
        recordsForDestination.forEach((record) => {
          if (record.effective !== group.effectiveDate) {
            updatedRecords.push({
              name: record.name,
              prefix: record.prefix,
              effective: group.effectiveDate,
            });
          }
        });
      }

      if (updatedRecords.length > 0) {
        // Use the store method to update records
        this.store.updateEffectiveDatesWithRecords(updatedRecords);
        console.log(`Updated effective dates for ${updatedRecords.length} records`);
      } else {
        console.log('No effective date updates needed');
      }
    } catch (error) {
      console.error('Failed to update effective dates:', error);
      throw error;
    }
  }

  /**
   * Updates effective dates using pre-processed records from the worker
   * @param updatedRecords Records with updated effective dates
   * @returns void
   */
  async updateEffectiveDatesWithRecords(updatedRecords: any[]): Promise<void> {
    try {
      if (!updatedRecords || updatedRecords.length === 0) {
        console.log('No records to update');
        return;
      }

      console.log(`Updating ${updatedRecords.length} records in store`);
      // Use the store's method to handle updates
      this.store.updateEffectiveDatesWithRecords(updatedRecords);
      console.log(`Successfully updated ${updatedRecords.length} records in store`);
    } catch (error) {
      console.error('Failed to update effective dates with records:', error);
      throw error;
    }
  }

  async processFile(
    file: File,
    columnMapping: Record<string, number>,
    startLine: number,
    progressCallback?: (progress: number, stage: import('@/types/components/upload-progress-types').UploadStage, rowsProcessed: number, totalRows?: number) => void
  ): Promise<{ fileName: string; records: RateSheetRecord[] }> {
    // Performance timing
    const performanceStart = performance.now();
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    console.log(`[PERF] AZ Rate Sheet - Starting upload processing for ${fileSizeMB}MB file...`);

    try {
      this.store.clearInvalidRows();

      // Memory accumulation arrays
      const allValidRecords: RateSheetRecord[] = [];
      const allInvalidRows: InvalidRow[] = [];
      let totalRowsProcessed = 0;
      let currentRowIndex = 0;

      return new Promise((resolve, reject) => {
        // Start progress tracking
        progressCallback?.(0, UploadStage.PARSING, 0);
        
        Papa.parse(file, {
          header: false,
          skipEmptyLines: true,
          worker: true, // Use Web Worker for better performance
          step: (results: { data: string[]; errors: any[] }, parser) => {
            currentRowIndex++;
            
            // Skip header rows based on user input
            if (currentRowIndex < startLine) return;

            try {
              const row = results.data;
              if (!row || row.length === 0) return;

              // Process row incrementally to avoid blocking
              const processedRow = this.processRowOptimized(row, currentRowIndex, columnMapping);
              
              if (processedRow.isValid) {
                allValidRecords.push(processedRow.record!);
              } else {
                allInvalidRows.push(processedRow.invalidRow!);
              }
              
              totalRowsProcessed++;

              // Progress logging every 1,000 rows with real progress callback
              if (totalRowsProcessed % 1000 === 0) {
                // Estimate parsing progress (0-70%)
                const parsingProgress = Math.min(70, (totalRowsProcessed / 1000) * 5); // Rough estimate
                progressCallback?.(parsingProgress, UploadStage.PARSING, totalRowsProcessed);
                console.log(`[PERF] AZ Rate Sheet - Processed ${totalRowsProcessed} rows...`);
              }
            } catch (error) {
              console.error(`Error processing row ${currentRowIndex}:`, error);
              const errorRow = results.data;
              allInvalidRows.push({
                destinationName: errorRow[columnMapping.name]?.trim() || 'N/A',
                prefix: errorRow[columnMapping.prefix]?.trim() || 'N/A',
                invalidRate: errorRow[columnMapping.rate]?.trim() || 'N/A',
                rowNumber: currentRowIndex + 1,
              });
            }
          },
          complete: async () => {
            try {
              console.log(`[PERF] AZ Rate Sheet - CSV parsing complete. Processing ${allValidRecords.length} valid records...`);
              
              // Update progress to validation stage
              progressCallback?.(75, UploadStage.VALIDATING, totalRowsProcessed, totalRowsProcessed);
              
              // Process in async chunks to avoid blocking the UI
              if (allValidRecords.length > 0) {
                // Update progress to storing stage
                progressCallback?.(85, UploadStage.STORING, totalRowsProcessed, totalRowsProcessed);
                
                await this.processRecordsInChunks(allValidRecords);
                console.log(`[PERF] AZ Rate Sheet - Stored ${allValidRecords.length} valid records`);
              }

              // Add invalid rows efficiently
              if (allInvalidRows.length > 0) {
                allInvalidRows.forEach(row => this.store.addInvalidRow(row));
                console.log(`[PERF] AZ Rate Sheet - Processed ${allInvalidRows.length} invalid rows`);
              }
              
              // Final progress update
              progressCallback?.(100, UploadStage.FINALIZING, totalRowsProcessed, totalRowsProcessed);

              // Performance timing - End
              const performanceEnd = performance.now();
              const duration = (performanceEnd - performanceStart) / 1000;
              const recordsPerSecond = duration > 0 ? Math.round(allValidRecords.length / duration) : 0;
              console.log(`[PERF] AZ Rate Sheet - Memory processing completed in ${duration.toFixed(2)}s`);
              console.log(`[PERF] AZ Rate Sheet - Processed ${allValidRecords.length} records at ${recordsPerSecond} records/sec`);

              resolve({ fileName: file.name, records: allValidRecords });
            } catch (error) {
              console.error('Error in complete callback:', error);
              reject(error);
            }
          },
          error: (error) => {
            const performanceEnd = performance.now();
            const duration = (performanceEnd - performanceStart) / 1000;
            console.log(`[PERF] AZ Rate Sheet - Upload failed after ${duration.toFixed(2)}s`);
            reject(new Error(`Failed to parse CSV: ${error.message}`));
          },
        });
      });
    } catch (error) {
      console.error('Error in processFile:', error);
      throw error;
    }
  }

  /**
   * Optimized row processing with pre-compiled regex patterns
   */
  private processRowOptimized(
    row: string[],
    rowIndex: number,
    columnMapping: Record<string, number>
  ): { isValid: boolean; record?: RateSheetRecord; invalidRow?: InvalidRow } {
    // Fast validation using pre-compiled patterns
    const rate = row[columnMapping.rate]?.trim();
    const prefix = row[columnMapping.prefix]?.trim();
    const name = row[columnMapping.name]?.trim() || '';

    // Quick validation checks
    if (!rate || !prefix) {
      return {
        isValid: false,
        invalidRow: {
          destinationName: name || 'N/A',
          prefix: prefix || 'N/A',
          invalidRate: rate || 'N/A',
          rowNumber: rowIndex + 1,
        },
      };
    }

    // Use pre-compiled regex for fast validation
    if (!RateSheetService.RATE_PATTERN.test(rate)) {
      return {
        isValid: false,
        invalidRow: {
          destinationName: name,
          prefix: prefix,
          invalidRate: rate,
          rowNumber: rowIndex + 1,
        },
      };
    }

    // Create record efficiently
    const record: RateSheetRecord = {
      name: row[columnMapping.name]?.trim() || '',
      prefix: prefix,
      rate: parseFloat(rate),
      effective: row[columnMapping.effective]?.trim() || '',
      changeCode: ChangeCode.SAME,
      minDuration: row[columnMapping.minDuration] ? parseInt(row[columnMapping.minDuration]) : undefined,
      increments: row[columnMapping.increments] ? parseInt(row[columnMapping.increments]) : undefined,
    };

    return { isValid: true, record };
  }

  /**
   * Process records efficiently - store all at once to avoid repeated grouping
   */
  private async processRecordsInChunks(records: RateSheetRecord[]): Promise<void> {
    // For memory-only storage, we can process all records at once
    // since we don't need to worry about IndexedDB chunking limitations
    this.store.processRateSheetDataComplete(records);
  }
}
