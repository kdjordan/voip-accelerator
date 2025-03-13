import { defineStore } from 'pinia';
import { ChangeCode } from '@/types/domains/rate-sheet-types';
import type {
  RateSheetState,
  RateSheetRecord,
  GroupedRateData,
  RateStatistics,
  InvalidRow,
  ChangeCodeType,
} from '@/types/domains/rate-sheet-types';

// Define interface for effective date settings
export interface EffectiveDateSettings {
  same: string;
  increase: string;
  decrease: string;
  sameCustomDate: string;
  increaseCustomDate: string;
  decreaseCustomDate: string;
}

export const useRateSheetStore = defineStore('rateSheet', {
  state: (): RateSheetState => ({
    error: null,
    isProcessing: false,
    isLocallyStored: false,
    groupedData: [],
    originalData: [],
    hasMinDuration: false,
    hasIncrements: false,
    invalidRows: [],
    effectiveDateSettings: {
      same: 'today',
      increase: 'week',
      decrease: 'today',
      sameCustomDate: new Date().toISOString().split('T')[0],
      increaseCustomDate: new Date().toISOString().split('T')[0],
      decreaseCustomDate: new Date().toISOString().split('T')[0]
    }
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
      const today = new Date().toISOString().split('T')[0];
      
      this.originalData = data.map(record => ({
        ...record,
        effective: record.effective || today,
        changeCode: record.changeCode || ChangeCode.SAME
      }));
    },

    setOptionalFields(mappings: Record<string, string>) {
      this.hasMinDuration = Object.values(mappings).includes('minDuration');
      this.hasIncrements = Object.values(mappings).includes('increments');
      this.isLocallyStored = true;
    },

    async updateDestinationRate(destinationName: string, newRate: number) {
      const today = new Date().toISOString().split('T')[0];
      
      const existingRecord = this.originalData.find(record => record.name === destinationName);
      
      if (!existingRecord) return;
      
      let changeCode: ChangeCodeType = ChangeCode.SAME;
      let effectiveDate = today;
      
      if (newRate > existingRecord.rate) {
        changeCode = ChangeCode.INCREASE;
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        effectiveDate = sevenDaysLater.toISOString().split('T')[0];
      } else if (newRate < existingRecord.rate) {
        changeCode = ChangeCode.DECREASE;
      }
      
      this.originalData = this.originalData.map(record =>
        record.name === destinationName 
          ? { 
              ...record, 
              rate: newRate, 
              changeCode: changeCode,
              effective: effectiveDate 
            } 
          : record
      );
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

    setEffectiveDateSettings(settings: EffectiveDateSettings) {
      this.effectiveDateSettings = { ...settings };
    },

    updateEffectiveDates(changeCode: ChangeCodeType, newDate: string) {
      // Update effective dates for all items with the specified change code
      this.groupedData = this.groupedData.map(item => {
        if (item.changeCode === changeCode) {
          return { ...item, effectiveDate: newDate };
        }
        return item;
      });
    },
    
    // Method to update grouped data with effective dates from worker
    updateGroupedDataEffectiveDates(updatedGroups: {destinationName: string, effectiveDate: string, changeCode: ChangeCodeType}[]) {
      // Create a lookup map for efficient updates
      const updateMap = new Map<string, {effectiveDate: string, changeCode: ChangeCodeType}>();
      
      // Build the lookup map
      updatedGroups.forEach(group => {
        updateMap.set(group.destinationName, {
          effectiveDate: group.effectiveDate,
          changeCode: group.changeCode
        });
      });
      
      // Update the grouped data
      this.groupedData = this.groupedData.map(group => {
        const update = updateMap.get(group.destinationName);
        if (update) {
          return {
            ...group,
            effectiveDate: update.effectiveDate,
            changeCode: update.changeCode
          };
        }
        return group;
      });
    }
  },

  getters: {
    getDiscrepancyCount: (state): number => {
      const count = state.groupedData.filter(group => group.hasDiscrepancy).length;
      console.log(`Destinations with rate discrepancies: ${count}`);
      return count;
    },

    getDestinationsByStatus: state => (hasDiscrepancy: boolean) =>
      state.groupedData.filter(group => group.hasDiscrepancy === hasDiscrepancy),

    getGroupedData: (state): GroupedRateData[] => {
      const groupedByName = new Map<string, RateSheetRecord[]>();

      state.originalData.forEach(record => {
        const records = groupedByName.get(record.name) || [];
        records.push(record);
        groupedByName.set(record.name, records);
      });

      return Array.from(groupedByName.entries()).map(([name, records]) => {
        const rateMap = new Map<number, number>();
        records.forEach(record => {
          const rate = typeof record.rate === 'string' ? parseFloat(record.rate) : record.rate;
          rateMap.set(rate, (rateMap.get(rate) || 0) + 1);
        });

        const totalRecords = records.length;

        const rates: RateStatistics[] = Array.from(rateMap.entries()).map(([rate, count]) => ({
          rate,
          count,
          percentage: (count / totalRecords) * 100,
          isCommon: false,
        }));

        const maxCount = Math.max(...rates.map(r => r.count));
        rates.forEach(rate => {
          rate.isCommon = rate.count === maxCount;
        });

        const effectiveDate = records[0]?.effective || '';
        const changeCode: ChangeCodeType = records[0]?.changeCode || ChangeCode.SAME;

        return {
          destinationName: name,
          codes: records.map(r => r.prefix),
          rates,
          hasDiscrepancy: rateMap.size > 1,
          effectiveDate,
          changeCode,
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

    getEffectiveDateSettings: (state): EffectiveDateSettings => {
      return state.effectiveDateSettings;
    },

    getEffectiveDateForChangeCode: (state) => (changeCode: ChangeCodeType): string => {
      const { same, increase, decrease, sameCustomDate, increaseCustomDate, decreaseCustomDate } = state.effectiveDateSettings;
      const today = new Date();
      let date = today;

      if (changeCode === ChangeCode.SAME) {
        if (same === 'today') {
          date = today;
        } else if (same === 'tomorrow') {
          date = new Date(today);
          date.setDate(today.getDate() + 1);
        } else if (same === 'custom') {
          return sameCustomDate;
        }
      } else if (changeCode === ChangeCode.INCREASE) {
        if (increase === 'today') {
          date = today;
        } else if (increase === 'tomorrow') {
          date = new Date(today);
          date.setDate(today.getDate() + 1);
        } else if (increase === 'week') {
          date = new Date(today);
          date.setDate(today.getDate() + 7);
        } else if (increase === 'custom') {
          return increaseCustomDate;
        }
      } else if (changeCode === ChangeCode.DECREASE) {
        if (decrease === 'today') {
          date = today;
        } else if (decrease === 'tomorrow') {
          date = new Date(today);
          date.setDate(today.getDate() + 1);
        } else if (decrease === 'custom') {
          return decreaseCustomDate;
        }
      }

      return date.toISOString().split('T')[0];
    }
  },
});
