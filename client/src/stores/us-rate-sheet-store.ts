import { defineStore } from 'pinia';
import { USRateSheetService } from '@/services/us-rate-sheet.service'; // Import service

interface USRateSheetState {
  hasUsRateSheetData: boolean;
  // usRateSheetTableName removed, handled by service
  usRateSheetEffectiveDate: string | null; // Keep if needed, might need to be loaded
  isLoading: boolean;
  error: string | null;
  // Maybe store the actual data if table component needs it?
  // rateSheetData: USRateSheetEntry[] = [];
}

// Instantiate service outside the store definition (singleton pattern)
const service = new USRateSheetService();

export const useUsRateSheetStore = defineStore('usRateSheet', {
  state: (): USRateSheetState => ({
    hasUsRateSheetData: false,
    usRateSheetEffectiveDate: null,
    isLoading: false,
    error: null,
    // rateSheetData: [],
  }),

  getters: {
    getHasUsRateSheetData: (state): boolean => state.hasUsRateSheetData,
    getUsRateSheetEffectiveDate: (state): string | null => state.usRateSheetEffectiveDate,
    getIsLoading: (state): boolean => state.isLoading,
    getError: (state): string | null => state.error,
    // getRateSheetData: (state) => state.rateSheetData,
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
        const data = await service.getData(); // Call service method
        this.hasUsRateSheetData = data.length > 0;
        // If storing data in state:
        // this.rateSheetData = data;
        // TODO: How to get effective date? Needs to be stored/retrieved separately
        // this.usRateSheetEffectiveDate = ???
        if (!this.hasUsRateSheetData) {
          this.usRateSheetEffectiveDate = null; // Clear date if no data
        }
        console.log(
          `[us-rate-sheet-store] loadRateSheetData finished. Found data: ${this.hasUsRateSheetData}`
        );
      } catch (err) {
        console.error('[us-rate-sheet-store] Error loading rate sheet data:', err);
        this.setError('Failed to load rate sheet data.');
        this.hasUsRateSheetData = false;
        this.usRateSheetEffectiveDate = null;
        // this.rateSheetData = [];
      } finally {
        this.setLoading(false);
      }
    },

    /**
     * Handles successful upload: potentially reloads data or just sets flags.
     * @param effectiveDate The effective date provided during upload.
     */
    async handleUploadSuccess(effectiveDate: string) {
      console.log(`[us-rate-sheet-store] handleUploadSuccess called with date: ${effectiveDate}`);
      // Option 1: Assume service stored data, just set flags
      // this.hasUsRateSheetData = true;
      // this.usRateSheetEffectiveDate = effectiveDate;
      // this.error = null;

      // Option 2: Reload data from Dexie to be sure
      await this.loadRateSheetData();
      // Still need to handle effective date persistence separately
      this.usRateSheetEffectiveDate = effectiveDate;
      // Consider saving effective date to local storage or a separate Dexie metadata table
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
        this.usRateSheetEffectiveDate = null;
        // this.rateSheetData = [];
        console.log('[us-rate-sheet-store] Cleared rate sheet data and reset state.');
      } catch (err) {
        console.error('[us-rate-sheet-store] Error clearing rate sheet data:', err);
        this.setError('Failed to clear local rate sheet data.');
      } finally {
        this.setLoading(false);
      }
    },
  },
});
