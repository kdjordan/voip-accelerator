import { defineStore } from 'pinia';
import { USRateSheetService } from '@/services/us-rate-sheet.service'; // Import service
import type { USRateSheetEntry } from '@/types/domains/us-types';

interface USRateSheetState {
  hasUsRateSheetData: boolean;
  // usRateSheetTableName removed, handled by service
  isLoading: boolean;
  error: string | null;
  totalRecords: number;
  currentEffectiveDate: string | null; // Add state for current effective date
  isUpdatingEffectiveDate: boolean; // Add state for update process
  rateSheetData: USRateSheetEntry[]; // Add state for the actual data
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
    rateSheetData: [], // Initialize data state
  }),

  getters: {
    getHasUsRateSheetData: (state): boolean => state.hasUsRateSheetData,
    getIsLoading: (state): boolean => state.isLoading || state.isUpdatingEffectiveDate, // Combine loading states
    getError: (state): string | null => state.error,
    getTotalRecords: (state): number => state.totalRecords,
    getCurrentEffectiveDate: (state): string | null => state.currentEffectiveDate, // Add getter
    getRateSheetData: (state): USRateSheetEntry[] => state.rateSheetData, // Add getter for data
  },

  actions: {
    setLoading(loading: boolean) {
      // This controls the main loading state (e.g., initial load, clear)
      // We'll use isUpdatingEffectiveDate for the specific update process
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
        const data = await service.getData(); // Call service method
        this.rateSheetData = data; // Store the fetched data
        this.hasUsRateSheetData = data.length > 0;
        this.totalRecords = data.length;
        // Fetch the effective date if data exists
        if (this.hasUsRateSheetData) {
          await this.fetchCurrentEffectiveDate();
        } else {
          this.currentEffectiveDate = null; // Clear date if no data
          this.totalRecords = 0;
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
     * Fetches the effective date from the first record in the dataset.
     */
    async fetchCurrentEffectiveDate() {
      console.log('[us-rate-sheet-store] Fetching current effective date...');
      this.setError(null);
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
     * Handles successful upload: potentially reloads data or just sets flags.
     * @param processedData The result from the service's processFile method.
     */
    async handleUploadSuccess(processedData: { recordCount: number }) {
      console.log(
        `[us-rate-sheet-store] handleUploadSuccess called with ${processedData.recordCount} records.`
      );

      // Set record count
      this.totalRecords = processedData.recordCount;

      // Set successful state
      this.hasUsRateSheetData = true;
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
        this.rateSheetData = []; // Clear data state
        console.log('[us-rate-sheet-store] Cleared rate sheet data and reset state.');
      } catch (err) {
        console.error('[us-rate-sheet-store] Error clearing rate sheet data:', err);
        this.setError('Failed to clear local rate sheet data.');
      } finally {
        this.setLoading(false);
      }
    },

    /**
     * Updates the effective date for all records.
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
        console.log(`[us-rate-sheet-store] Effective date updated successfully to ${newDate}`);
        // Trigger data reload to refresh table and ensure consistency
        await this.loadRateSheetData();
        console.log('[us-rate-sheet-store] Data reloaded after effective date update.');
      } catch (err) {
        console.error('[us-rate-sheet-store] Error updating effective date:', err);
        this.setError('Failed to update effective date.');
        // Optionally revert selectedEffectiveDate in the component or refetch old date
        // Consider re-fetching the old date to ensure UI consistency on error
        await this.fetchCurrentEffectiveDate();
      } finally {
        this.isUpdatingEffectiveDate = false;
      }
    },

    /**
     * Gets the total number of records in the rate sheet
     */
    async getRecordCount(): Promise<number> {
      try {
        const data = await service.getData();
        return data.length;
      } catch (error) {
        console.error('[us-rate-sheet-store] Error getting record count:', error);
        return 0;
      }
    },
  },
});
