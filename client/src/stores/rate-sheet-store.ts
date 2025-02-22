import { defineStore } from 'pinia';
import type { RateSheetState, RateSheetRecord, GroupedRateData, RateStatistics } from '@/types/rate-sheet-types';

export const useRateSheetStore = defineStore('rateSheet', {
  state: (): RateSheetState => ({
    error: null,
    isProcessing: false,
    isLocallyStored: false,
    groupedData: [],
    originalData: [],
  }),

  actions: {
    setError(error: string | null) {
      this.error = error;
    },

    setProcessing(isProcessing: boolean) {
      this.isProcessing = isProcessing;
    },

    setLocallyStored(isStored: boolean) {
      this.isLocallyStored = isStored;
    },

    setGroupedData(data: GroupedRateData[]) {
      this.groupedData = data;
    },

    setOriginalData(data: RateSheetRecord[]) {
      this.originalData = data;
    },

    async updateDestinationRate(destinationName: string, newRate: number) {
      // Update the store's original data
      this.originalData = this.originalData.map(record =>
        record.name === destinationName ? { ...record, rate: newRate } : record
      );

      // The getGroupedData getter will automatically:
      // - Group by destination
      // - Recalculate rates and discrepancies
      // - Update the UI accordingly
    },

    clearData() {
      this.originalData = [];
      this.groupedData = [];
      this.isLocallyStored = false;
    },
  },

  getters: {
    getDiscrepancyCount: (state): number => state.groupedData.filter(group => group.hasDiscrepancy).length,

    getDestinationsByStatus: state => (hasDiscrepancy: boolean) =>
      state.groupedData.filter(group => group.hasDiscrepancy === hasDiscrepancy),

    getGroupedData: (state): GroupedRateData[] => {
      const groupedByName = new Map<string, RateSheetRecord[]>();

      // Group records by destination name
      state.originalData.forEach(record => {
        const records = groupedByName.get(record.name) || [];
        records.push(record);
        groupedByName.set(record.name, records);
      });

      // Process each group
      return Array.from(groupedByName.entries()).map(([name, records]) => {
        // Calculate rate statistics
        const rateMap = new Map<number, number>();
        records.forEach(record => {
          rateMap.set(parseFloat(record.rate), (rateMap.get(parseFloat(record.rate)) || 0) + 1);
        });

        return {
          destinationName: name,
          codes: records.map(r => r.prefix),
          rates: Array.from(rateMap.entries()).map(([rate, count]) => ({ rate, count })),
          hasDiscrepancy: rateMap.size > 1,
          effectiveDate: records[0].effective || '', // Provide default value
          minDuration: records[0].minDuration || 0, // Provide default value
          increments: records[0].increments || 0, // Provide default value
        };
      });
    },
  },
});
