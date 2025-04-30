import { defineStore } from 'pinia';
import { USRateSheetService } from '@/services/us-rate-sheet.service'; // Import service
import type { USRateSheetEntry, InvalidUSRateSheetRow } from '@/types/domains/us-types';

interface USRateSheetState {
  hasUsRateSheetData: boolean;
  isLoading: boolean;
  error: string | null;
  totalRecords: number;
  currentEffectiveDate: string | null; // Add state for current effective date
  isUpdatingEffectiveDate: boolean; // Add state for update process
  lastDbUpdateTime: number; // Timestamp to trigger reactive updates in components
  invalidRateSheetRows: InvalidUSRateSheetRow[]; // Added state for invalid rows
}

// Instantiate service outside the store definition (singleton pattern)
const service = new USRateSheetService();

export const useUsRateSheetStore = defineStore('usRateSheet', {
  state: (): USRateSheetState => ({
    hasUsRateSheetData: false,
    isLoading: false,
    error: null,
    totalRecords: 0,
    currentEffectiveDate: null,
    isUpdatingEffectiveDate: false,
    lastDbUpdateTime: Date.now(), // Initialize timestamp
    invalidRateSheetRows: [], // Initialize invalid rows state
  }),

  getters: {
    getHasUsRateSheetData: (state): boolean => state.hasUsRateSheetData,
    getIsLoading: (state): boolean => state.isLoading || state.isUpdatingEffectiveDate, // Combine loading states
    getError: (state): string | null => state.error,
    getTotalRecords: (state): number => state.totalRecords,
    getCurrentEffectiveDate: (state): string | null => state.currentEffectiveDate, // Add getter
    getInvalidRateSheetRows: (state): InvalidUSRateSheetRow[] => state.invalidRateSheetRows, // Added getter
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
     * Attempts to load metadata (effective date) from the Dexie table via the service.
     * Updates state based on success.
     */
    async loadRateSheetData() {
      console.log('[us-rate-sheet-store] loadRateSheetData (metadata - date only) starting...');
      this.setLoading(true);
      this.setError(null);
      try {
        // Only fetch the effective date for now
        const date = await service.getCurrentEffectiveDate();
        this.currentEffectiveDate = date;

        // Update state based on date presence (count will be updated after upload/clear)
        this.hasUsRateSheetData = date !== null;
        // Reset count here, it will be updated on successful upload
        this.totalRecords = this.hasUsRateSheetData ? this.totalRecords : 0; // Keep existing count if date found, else 0

        console.log(
          `[us-rate-sheet-store] loadRateSheetData finished. Found data: ${this.hasUsRateSheetData}, effectiveDate: ${this.currentEffectiveDate}`
        );
      } catch (err) {
        console.error('[us-rate-sheet-store] Error loading rate sheet metadata (date):', err);
        this.setError('Failed to load rate sheet metadata.');
        this.hasUsRateSheetData = false;
        this.currentEffectiveDate = null;
        this.totalRecords = 0;
      } finally {
        this.setLoading(false);
      }
    },

    /**
     * Fetches the effective date from the first record in the dataset via the service.
     */
    async fetchCurrentEffectiveDate() {
      console.log('[us-rate-sheet-store] Fetching current effective date...');
      try {
        const date = await service.getCurrentEffectiveDate();
        this.currentEffectiveDate = date;
        console.log(`[us-rate-sheet-store] Current effective date set to: ${date}`);
      } catch (err) {
        console.error('[us-rate-sheet-store] Error fetching effective date:', err);
        this.setError('Failed to fetch current effective date.');
        this.currentEffectiveDate = null;
      }
    },

    /**
     * Handles successful upload: updates metadata and stores invalid rows.
     * @param processedData The result from the service's processFile method.
     */
    async handleUploadSuccess(processedData: {
      recordCount: number;
      invalidRows: InvalidUSRateSheetRow[];
    }) {
      console.log(
        `[us-rate-sheet-store] handleUploadSuccess called with ${processedData.recordCount} valid records and ${processedData.invalidRows.length} invalid rows.`
      );

      // Store invalid rows
      this.invalidRateSheetRows = processedData.invalidRows;
      // Update metadata based on processed data
      this.totalRecords = processedData.recordCount;
      this.hasUsRateSheetData = processedData.recordCount > 0;
      this.error = null;

      // Fetch the effective date (which should have been set during processing)
      await this.fetchCurrentEffectiveDate();

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
     * Updates the effective date for all records via the service.
     * @param newDate The new effective date string (YYYY-MM-DD).
     */
    async updateEffectiveDate(newDate: string) {
      console.log(`[us-rate-sheet-store] Attempting to update effective date to: ${newDate}`);
      this.isUpdatingEffectiveDate = true;
      this.setError(null);
      try {
        await service.updateAllEffectiveDates(newDate);
        // Update successful, refresh the current date in the store
        this.currentEffectiveDate = newDate;
        // Update the timestamp to notify listeners
        this.lastDbUpdateTime = Date.now();
        console.log(
          `[us-rate-sheet-store] Effective date updated successfully to ${newDate} and timestamp updated.`
        );
      } catch (err) {
        console.error('[us-rate-sheet-store] Error updating effective date:', err);
        this.setError('Failed to update effective date.');
        // Re-fetch the old date to ensure UI consistency on error
        await this.fetchCurrentEffectiveDate();
      } finally {
        this.isUpdatingEffectiveDate = false;
      }
    },
  },
});
