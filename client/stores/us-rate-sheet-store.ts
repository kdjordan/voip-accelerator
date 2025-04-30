import { defineStore } from 'pinia';
import { USRateSheetService } from '@/services/us-rate-sheet.service'; // Import service
import type { USRateSheetEntry, InvalidUsRow } from '@/types/domains/us-types'; // Corrected import

interface USRateSheetState {
  hasUsRateSheetData: boolean;
  isUpdatingEffectiveDate: boolean; // Add state for update process
  lastDbUpdateTime: number; // Timestamp to trigger reactive updates in components
  invalidRateSheetRows: InvalidUsRow[]; // Updated type usage
}

export const useUsRateSheetStore = defineStore('usRateSheet', {
  state: (): USRateSheetState => ({
    hasUsRateSheetData: false,
    isUpdatingEffectiveDate: false,
    lastDbUpdateTime: Date.now(), // Initialize timestamp
    invalidRateSheetRows: [], // Initialize invalid rows state
  }),

  getters: {
    getTotalRecords: (state): number => state.totalRecords,
    getCurrentEffectiveDate: (state): string | null => state.currentEffectiveDate, // Add getter
    getInvalidRateSheetRows: (state): InvalidUsRow[] => state.invalidRateSheetRows, // Updated type usage
    hasInvalidRateSheetRows: (state): boolean => state.invalidRateSheetRows.length > 0, // Added getter
  },

  actions: {
    async handleUploadSuccess(processedData: {
      recordCount: number;
      invalidRows: InvalidUsRow[]; // Updated type usage
    }) {
      console.log(
        `[us-rate-sheet-store] handleUploadSuccess called with ${processedData.recordCount} valid records and ${processedData.invalidRows.length} invalid rows.`
      );
    },
  },
});
