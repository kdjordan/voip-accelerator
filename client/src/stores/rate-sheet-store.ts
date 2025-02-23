import { defineStore } from 'pinia';
import type {
  RateSheetState,
  RateSheetRecord,
  GroupedRateData,
  RateStatistics,
  InvalidRow,
} from '@/types/rate-sheet-types';

export const useRateSheetStore = defineStore('rateSheet', {
  state: (): RateSheetState => ({
    error: null,
    isProcessing: false,
    isLocallyStored: false,
    groupedData: [],
    originalData: [],
    hasEffectiveDate: false,
    hasMinDuration: false,
    hasIncrements: false,
    invalidRows: [],
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

    setOptionalFields(mappings: Record<string, string>) {
      this.hasEffectiveDate = 'effective' in mappings;
      this.hasMinDuration = 'minDuration' in mappings;
      this.hasIncrements = 'increments' in mappings;
      this.isLocallyStored = true;
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
      this.invalidRows = [];
    },

    addInvalidRow(row: InvalidRow) {
      this.invalidRows.push(row);
    },

    clearInvalidRows() {
      this.invalidRows = [];
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
          const rate = typeof record.rate === 'string' ? parseFloat(record.rate) : record.rate;
          rateMap.set(rate, (rateMap.get(rate) || 0) + 1);
        });

        // Calculate total records for percentage
        const totalRecords = records.length;

        // Convert rate map to array of rate statistics
        const rates: RateStatistics[] = Array.from(rateMap.entries()).map(([rate, count]) => ({
          rate,
          count,
          percentage: (count / totalRecords) * 100,
          isCommon: false, // Will be set after determining most common rate
        }));

        // Find the most common rate
        const maxCount = Math.max(...rates.map(r => r.count));
        rates.forEach(rate => {
          rate.isCommon = rate.count === maxCount;
        });

        return {
          destinationName: name,
          codes: records.map(r => r.prefix),
          rates,
          hasDiscrepancy: rateMap.size > 1,
          effectiveDate: records[0]?.effective,
          minDuration: records[0]?.minDuration,
          increments: records[0]?.increments,
        };
      });
    },

    hasInvalidRows: (state): boolean => state.invalidRows.length > 0,

    getGroupedInvalidRows: state => {
      const grouped = new Map<string, { prefix: string; invalidRate: string }[]>();

      state.invalidRows.forEach((row: InvalidRow) => {
        const existing = grouped.get(row.destinationName) || [];
        existing.push({ prefix: row.prefix, invalidRate: row.invalidRate });
        grouped.set(row.destinationName, existing);
      });

      return Array.from(grouped.entries()).map(([name, rows]) => ({
        destinationName: name,
        rows,
        count: rows.length,
      }));
    },
  },
});
