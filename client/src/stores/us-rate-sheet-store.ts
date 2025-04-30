import { defineStore } from 'pinia';
import { USRateSheetService } from '@/services/us-rate-sheet.service'; // Import service
import type { USRateSheetEntry, InvalidUSRateSheetRow } from '@/types/domains/us-types';

interface USRateSheetState {
  hasUsRateSheetData: boolean;
  // usRateSheetTableName removed, handled by service
  isLoading: boolean;
  error: string | null;
  totalRecords: number;
  currentEffectiveDate: string | null; // Add state for current effective date
  isUpdatingEffectiveDate: boolean; // Add state for update process
  rateSheetData: USRateSheetEntry[]; // RESTORED: state for the actual data
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
    rateSheetData: [], // RESTORED: Initialize data state
    lastDbUpdateTime: Date.now(), // Initialize timestamp
    invalidRateSheetRows: [], // Initialize invalid rows state
  }),

  getters: {
    getHasUsRateSheetData: (state): boolean => state.hasUsRateSheetData,
    getIsLoading: (state): boolean => state.isLoading || state.isUpdatingEffectiveDate, // Combine loading states
    getError: (state): string | null => state.error,
    getTotalRecords: (state): number => state.totalRecords,
    getCurrentEffectiveDate: (state): string | null => state.currentEffectiveDate, // Add getter
    getRateSheetData: (state): USRateSheetEntry[] => state.rateSheetData, // RESTORED: getter for data
    getInvalidRateSheetRows: (state): InvalidUSRateSheetRow[] => state.invalidRateSheetRows, // Added getter
  },

  actions: {
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    /**
     * Attempts to load data from the Dexie table via the service.
     * Updates state based on success.
     */
    async loadRateSheetData() {
      console.log('[us-rate-sheet-store] loadRateSheetData starting...');
      this.setLoading(true);
      this.setError(null);
      try {
        // RESTORED: Get all data
        const data = await service.getData(); // Call service method
        this.rateSheetData = data; // Store the fetched data
        this.totalRecords = data.length;
        this.hasUsRateSheetData = data.length > 0;

        // Fetch the effective date if data exists
        if (this.hasUsRateSheetData) {
          await this.fetchCurrentEffectiveDate();
        } else {
          this.currentEffectiveDate = null; // Clear date if no data
        }
        console.log(
          `[us-rate-sheet-store] loadRateSheetData finished. Found data: ${this.hasUsRateSheetData}, records: ${this.totalRecords}, effectiveDate: ${this.currentEffectiveDate}`
        );
      } catch (err) {
        console.error('[us-rate-sheet-store] Error loading rate sheet data:', err);
        this.setError('Failed to load rate sheet data.');
        this.hasUsRateSheetData = false;
        this.currentEffectiveDate = null;
        this.totalRecords = 0;
        this.rateSheetData = []; // Clear data on error
      } finally {
        this.setLoading(false);
      }
    },

    /**
     * Fetches the effective date from the first record in the dataset via the service.
     */
    async fetchCurrentEffectiveDate() {
      console.log('[us-rate-sheet-store] Fetching current effective date...');
      // REVERTED: Removed setting error/loading here as it was before
      try {
        const date = await service.getCurrentEffectiveDate();
        this.currentEffectiveDate = date;
        console.log(`[us-rate-sheet-store] Current effective date set to: ${date}`);
      } catch (err) {
        console.error('[us-rate-sheet-store] Error fetching effective date:', err);
        // REVERTED: Setting error
        this.setError('Failed to fetch current effective date.');
        this.currentEffectiveDate = null; // Still clear date on error
      }
    },

    /**
     * Handles successful upload: reloads data and stores invalid rows.
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
      // totalRecords and hasUsRateSheetData will be set by loadRateSheetData
      this.error = null;

      // Reload data from Dexie to ensure consistency and fetch effective date
      await this.loadRateSheetData();

      console.log('[us-rate-sheet-store] US Rate Sheet data loaded successfully after upload');
    },

    /**
     * Clears the US Rate Sheet data state and triggers Dexie table clearing via service.
     */
    async clearUsRateSheetData() {
      this.setLoading(true);
      this.setError(null);
      try {
        await service.clearData(); // Call service method
        this.hasUsRateSheetData = false;
        this.currentEffectiveDate = null; // Clear effective date
        this.totalRecords = 0;
        this.rateSheetData = []; // RESTORED: Clear data state
        this.invalidRateSheetRows = []; // Clear invalid rows state
        console.log('[us-rate-sheet-store] Cleared rate sheet data and reset state.');
      } catch (err) {
        console.error('[us-rate-sheet-store] Error clearing rate sheet data:', err);
        this.setError('Failed to clear local rate sheet data.');
      } finally {
        this.setLoading(false);
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
        // RESTORED: Trigger data reload (original behavior - might be desired or not)
        await this.loadRateSheetData();
        console.log('[us-rate-sheet-store] Data reloaded after effective date update.');
      } catch (err) {
        console.error('[us-rate-sheet-store] Error updating effective date:', err);
        this.setError('Failed to update effective date.');
        // Re-fetch the old date to ensure UI consistency on error
        await this.fetchCurrentEffectiveDate();
      } finally {
        this.isUpdatingEffectiveDate = false;
      }
    },

    // REVERTED: Removed the store's getRecordCount action
  },
});
