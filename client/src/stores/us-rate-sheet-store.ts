import { defineStore } from 'pinia';
import { USRateSheetService } from '@/services/us-rate-sheet.service'; // Import service
import type { USRateSheetEntry } from '@/types/domains/rate-sheet-types';
import type { InvalidUsRow } from '@/types/domains/us-types';
// Add date-fns for default date calculation
import { addDays, format } from 'date-fns';

interface USRateSheetState {
  hasUsRateSheetData: boolean;
  isLoading: boolean;
  error: string | null;
  totalRecords: number;
  currentEffectiveDate: string | null; // Store global effective date
  // isUpdatingEffectiveDate: boolean; // Removed
  lastDbUpdateTime: number; // Timestamp to trigger reactive updates in components
  invalidRateSheetRows: InvalidUsRow[]; // Added state for invalid rows
}

// Instantiate service outside the store definition (singleton pattern)
const service = new USRateSheetService();

// Helper to get default effective date (7 days from now)
function getDefaultEffectiveDate(): string {
  return format(addDays(new Date(), 7), 'yyyy-MM-dd');
}

export const useUsRateSheetStore = defineStore('usRateSheet', {
  state: (): USRateSheetState => ({
    hasUsRateSheetData: false,
    isLoading: false,
    error: null,
    totalRecords: 0,
    currentEffectiveDate: null, // Initialize as null
    // isUpdatingEffectiveDate: false, // Removed
    lastDbUpdateTime: Date.now(), // Initialize timestamp
    invalidRateSheetRows: [], // Initialize invalid rows state
  }),

  getters: {
    getHasUsRateSheetData: (state): boolean => state.hasUsRateSheetData,
    getIsLoading: (state): boolean => state.isLoading, // Removed isUpdatingEffectiveDate
    getError: (state): string | null => state.error,
    getTotalRecords: (state): number => state.totalRecords,
    getCurrentEffectiveDate: (state): string | null => state.currentEffectiveDate, // Getter remains
    getInvalidRateSheetRows: (state): InvalidUsRow[] => state.invalidRateSheetRows, // Added getter
    hasInvalidRateSheetRows: (state): boolean => state.invalidRateSheetRows.length > 0, // Added getter
  },

  actions: {
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    /**
     * Checks if data exists based on totalRecords count from service (after upload/clear).
     * No longer fetches effective date on initial load.
     */
    async loadRateSheetData() {
      console.log('[us-rate-sheet-store] loadRateSheetData starting (check existence only)...');
      this.setLoading(true);
      this.setError(null);
      try {
        // We primarily rely on handleUploadSuccess to set initial state.
        // This action might just check if the DB exists or has tables via service if needed,
        // but for now, let's assume initial state is empty until upload.
        const count = await service.getRecordCount(); // Assuming service has a count method
        this.totalRecords = count;
        this.hasUsRateSheetData = count > 0;
        // Don't set effective date here; it's set on upload or update.
        // If data exists but date is null, it means it hasn't been set yet.
        console.log(
          `[us-rate-sheet-store] loadRateSheetData finished. Record count: ${this.totalRecords}, Has data: ${this.hasUsRateSheetData}`
        );
      } catch (err) {
        console.error('[us-rate-sheet-store] Error checking rate sheet data existence:', err);
        this.setError('Failed to check rate sheet data existence.');
        this.hasUsRateSheetData = false;
        this.currentEffectiveDate = null;
        this.totalRecords = 0;
      } finally {
        this.setLoading(false);
      }
    },

    /**
     * Handles successful upload: updates metadata, stores invalid rows, sets default effective date.
     * @param processedData The result from the service's processFile method.
     */
    async handleUploadSuccess(processedData: { recordCount: number; invalidRows: InvalidUsRow[] }) {
      console.log(
        `[us-rate-sheet-store] handleUploadSuccess called with ${processedData.recordCount} valid records and ${processedData.invalidRows.length} invalid rows.`
      );

      // Store invalid rows
      this.invalidRateSheetRows = processedData.invalidRows;
      // Update metadata based on processed data
      this.totalRecords = processedData.recordCount;
      this.hasUsRateSheetData = processedData.recordCount > 0;
      this.error = null;

      // Set default effective date only if data was successfully added
      if (this.hasUsRateSheetData) {
        this.currentEffectiveDate = getDefaultEffectiveDate();
        console.log(
          `[us-rate-sheet-store] Default effective date set to: ${this.currentEffectiveDate}`
        );
      } else {
        this.currentEffectiveDate = null; // No data, no date
      }

      // Update timestamp to trigger reactivity
      this.lastDbUpdateTime = Date.now();

      console.log('[us-rate-sheet-store] US Rate Sheet metadata updated successfully after upload');
    },

    /**
     * Clears the US Rate Sheet data state and triggers Dexie table clearing via service.
     */
    async clearUsRateSheetData() {
      this.setLoading(true);
      this.setError(null);
      try {
        await service.clearData(); // Call service method which now deletes the DB
        this.hasUsRateSheetData = false;
        this.currentEffectiveDate = null; // Clear effective date
        this.totalRecords = 0;
        this.invalidRateSheetRows = []; // Clear invalid rows state
        console.log('[us-rate-sheet-store] Cleared rate sheet data and reset state.');
      } catch (err) {
        console.error('[us-rate-sheet-store] Error clearing rate sheet data:', err);
        this.setError('Failed to clear local rate sheet data.');
      } finally {
        this.setLoading(false);
        this.lastDbUpdateTime = 0; // Reset timestamp to indicate cleared/initial state
      }
    },

    /**
     * Updates the global effective date in the store state.
     * @param newDate The new effective date string (YYYY-MM-DD).
     */
    updateEffectiveDate(newDate: string) {
      console.log(`[us-rate-sheet-store] Updating global effective date to: ${newDate}`);
      this.setError(null); // Clear any previous errors

      // Directly update the state
      this.currentEffectiveDate = newDate;

      // Update the timestamp to notify listeners (e.g., table display)
      this.lastDbUpdateTime = Date.now();

      console.log(
        `[us-rate-sheet-store] Global effective date updated successfully to ${newDate} and timestamp updated.`
      );
    },
  },
});

// Helper to get default effective date (7 days from now) - Duplicated from above for clarity
// function getDefaultEffectiveDate(): string { // Removed duplicate
//   return format(addDays(new Date(), 7), 'yyyy-MM-dd');
// }
