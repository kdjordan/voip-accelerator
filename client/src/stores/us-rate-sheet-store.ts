import { defineStore } from 'pinia';
import { USRateSheetService } from '@/services/us-rate-sheet.service'; // Import service
import type { USRateSheetEntry } from '@/types/domains/us-types';

interface USRateSheetState {
  hasUsRateSheetData: boolean;
  // usRateSheetTableName removed, handled by service
  isLoading: boolean;
  error: string | null;
  totalRecords: number;
  // Maybe store the actual data if table component needs it?
  // rateSheetData: USRateSheetEntry[] = [];
}

// Instantiate service outside the store definition (singleton pattern)
const service = new USRateSheetService();

export const useUsRateSheetStore = defineStore('usRateSheet', {
  state: (): USRateSheetState => ({
    hasUsRateSheetData: false,
    isLoading: false,
    error: null,
    totalRecords: 0,
    // rateSheetData: [],
  }),

  getters: {
    getHasUsRateSheetData: (state): boolean => state.hasUsRateSheetData,
    getIsLoading: (state): boolean => state.isLoading,
    getError: (state): string | null => state.error,
    getTotalRecords: (state): number => state.totalRecords,
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
        this.totalRecords = data.length;
        // If storing data in state:
        // this.rateSheetData = data;
        // TODO: How to get effective date? Needs to be stored/retrieved separately
        // Effective date is now per-record, no single date needed
        if (!this.hasUsRateSheetData) {
          this.totalRecords = 0;
        }
        console.log(
          `[us-rate-sheet-store] loadRateSheetData finished. Found data: ${this.hasUsRateSheetData}, records: ${this.totalRecords}`
        );
      } catch (err) {
        console.error('[us-rate-sheet-store] Error loading rate sheet data:', err);
        this.setError('Failed to load rate sheet data.');
        this.hasUsRateSheetData = false;
        this.totalRecords = 0;
        // this.rateSheetData = [];
      } finally {
        this.setLoading(false);
      }
    },

    /**
     * Handles successful upload: potentially reloads data or just sets flags.
     * @param fileName The name of the file that was processed.
     */
    async handleUploadSuccess(processedData: { recordCount: number /* other fields maybe */ }) {
      console.log(
        `[us-rate-sheet-store] handleUploadSuccess called with ${processedData.recordCount} records.`
      );

      // Update total records from the processed data result
      this.totalRecords = processedData.recordCount;

      // Set successful state
      this.hasUsRateSheetData = true;
      this.error = null;

      // Option: Reload data from Dexie to ensure consistency
      await this.loadRateSheetData();

      console.log('[us-rate-sheet-store] US Rate Sheet data loaded successfully');
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
        this.totalRecords = 0;
        // this.rateSheetData = [];
        console.log('[us-rate-sheet-store] Cleared rate sheet data and reset state.');
      } catch (err) {
        console.error('[us-rate-sheet-store] Error clearing rate sheet data:', err);
        this.setError('Failed to clear local rate sheet data.');
      } finally {
        this.setLoading(false);
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
