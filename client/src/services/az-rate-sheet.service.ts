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

export class RateSheetService {
  private store = useAzRateSheetStore();

  constructor() {
    console.log('Initializing Rate Sheet service');
    // Clear any localStorage data that might exist from previous sessions
    localStorage.removeItem('voip-accelerator-rate-sheet-data');
    localStorage.removeItem('voip-accelerator-rate-sheet-settings');
    localStorage.removeItem('voip-accelerator-rate-sheet-invalid');
    localStorage.removeItem('rate-sheet-optional-fields');
    console.log('Rate Sheet data persistence is disabled - using in-memory storage only');
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
    startLine: number
  ): Promise<{ fileName: string; records: RateSheetRecord[] }> {
    try {
      this.store.clearInvalidRows();

      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: false,
          skipEmptyLines: true,
          complete: async (results: { data: string[][] }) => {
            try {
              // Skip to user-specified start line
              const dataRows = results.data.slice(startLine - 1);

              // Process the data using the store's method
              const { records: validRecords, invalidRows } = this.store.processFileData(
                dataRows,
                columnMapping
              );

              if (validRecords.length > 0) {
                // Store the data directly in the store
                this.store.processRateSheetData(validRecords);
                console.log(`Stored ${validRecords.length} valid records`);
              } else {
                console.log('No valid records to store');
              }

              // Add any invalid rows to the store
              invalidRows.forEach((row) => {
                this.store.addInvalidRow(row);
              });

              resolve({ fileName: file.name, records: validRecords });
            } catch (error) {
              console.error('Error processing file data:', error);
              reject(error);
            }
          },
          error: (error) => reject(new Error(`Failed to parse CSV: ${error.message}`)),
        });
      });
    } catch (error) {
      console.error('Error in processFile:', error);
      throw error;
    }
  }
}
