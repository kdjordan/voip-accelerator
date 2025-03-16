import { defineStore } from 'pinia';
import { ChangeCode } from '@/types/domains/rate-sheet-types';
import type {
  RateSheetState,
  RateSheetRecord,
  GroupedRateData,
  RateStatistics,
  InvalidRow,
  ChangeCodeType,
  EffectiveDateSettings
} from '@/types/domains/rate-sheet-types';


const STORAGE_KEY = 'voip-accelerator-rate-sheet-data';
const STORAGE_KEY_SETTINGS = 'voip-accelerator-rate-sheet-settings';
const STORAGE_KEY_INVALID = 'voip-accelerator-rate-sheet-invalid';

export const useRateSheetStore = defineStore('rateSheet', {
  state: (): RateSheetState => ({
    error: null,
    isProcessing: false,
    isLocallyStored: false,
    groupedData: [],
    originalData: [],
    invalidRows: [],
    effectiveDateSettings: {
      same: 'today',
      increase: 'week',
      decrease: 'today',
      sameCustomDate: new Date().toISOString().split('T')[0],
      increaseCustomDate: new Date().toISOString().split('T')[0],
      decreaseCustomDate: new Date().toISOString().split('T')[0]
    },
    optionalFields: {
      hasMinDuration: false,
      hasIncrements: false
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
      this.saveToLocalStorage();
    },

    setOptionalFields(mappings: Record<string, string>) {
      this.optionalFields = {
        hasMinDuration: Object.values(mappings).includes('minDuration'),
        hasIncrements: Object.values(mappings).includes('increments')
      };
      localStorage.setItem('rate-sheet-optional-fields', JSON.stringify(this.optionalFields));
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
      this.saveToLocalStorage();
      
      // Update grouped data
      const updatedGroupedData = this.groupedData.map(group => {
        if (group.destinationName === destinationName) {
          // Rebuild the rates statistics
          const recordsForDestination = this.originalData.filter(r => r.name === destinationName);
          const totalRecords = recordsForDestination.length;
          
          // Since we've just unified the rate, we'll have only one rate with 100% usage
          const rates: RateStatistics[] = [{
            rate: newRate,
            count: totalRecords,
            percentage: 100,
            isCommon: true
          }];
          
          return {
            ...group,
            rates,
            hasDiscrepancy: false
          };
        }
        return group;
      });
      
      this.groupedData = updatedGroupedData;
      this.saveToLocalStorage();
      
      return true;
    },

    // High-performance bulk update for handling multiple destinations at once
    async bulkUpdateDestinationRates(updates: { name: string, rate: number }[]) {
      const today = new Date().toISOString().split('T')[0];
      
      // Create a map for quick lookups
      const updateMap = new Map<string, number>();
      for (const update of updates) {
        updateMap.set(update.name, update.rate);
      }
      
      // First collect all destinations and their new rates
      const destinationsToUpdate = new Set<string>();
      updates.forEach(update => destinationsToUpdate.add(update.name));
      
      // Single pass through the originalData array for maximum efficiency
      this.originalData = this.originalData.map(record => {
        if (destinationsToUpdate.has(record.name)) {
          const newRate = updateMap.get(record.name);
          if (newRate === undefined) return record;
          
          let changeCode: ChangeCodeType = ChangeCode.SAME;
          let effectiveDate = today;
          
          if (newRate > record.rate) {
            changeCode = ChangeCode.INCREASE;
            const sevenDaysLater = new Date();
            sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
            effectiveDate = sevenDaysLater.toISOString().split('T')[0];
          } else if (newRate < record.rate) {
            changeCode = ChangeCode.DECREASE;
          }
          
          return { 
            ...record, 
            rate: newRate, 
            changeCode: changeCode,
            effective: effectiveDate 
          };
        }
        return record;
      });
      
      // Update grouped data in a single efficient operation
      const updatedGroupedData: GroupedRateData[] = [];
      const processedDestinations = new Set<string>();
      
      for (const group of this.groupedData) {
        if (destinationsToUpdate.has(group.destinationName) && !processedDestinations.has(group.destinationName)) {
          const newRate = updateMap.get(group.destinationName);
          if (newRate !== undefined) {
            const recordsForDestination = this.originalData.filter(r => r.name === group.destinationName);
            const totalRecords = recordsForDestination.length;
            
            // Since we're unifying the rate, there will be only one rate with 100% usage
            const rates: RateStatistics[] = [{
              rate: newRate,
              count: totalRecords,
              percentage: 100,
              isCommon: true
            }];
            
            updatedGroupedData.push({
              ...group,
              rates,
              hasDiscrepancy: false
            });
            
            processedDestinations.add(group.destinationName);
          } else {
            updatedGroupedData.push(group);
          }
        } else if (!processedDestinations.has(group.destinationName)) {
          updatedGroupedData.push(group);
        }
      }
      
      this.groupedData = updatedGroupedData;
      this.saveToLocalStorage();
      
      return true;
    },

    clearData() {
      this.originalData = [];
      this.groupedData = [];
      this.isLocallyStored = false;
      this.invalidRows = [];
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY_INVALID);
    },

    addInvalidRow(row: InvalidRow) {
      this.invalidRows.push(row);
      this.saveInvalidRowsToLocalStorage();
    },

    clearInvalidRows() {
      this.invalidRows = [];
      this.saveInvalidRowsToLocalStorage();
    },

    setEffectiveDateSettings(settings: EffectiveDateSettings) {
      this.effectiveDateSettings = { ...settings };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.effectiveDateSettings));
    },

    updateEffectiveDates(changeCode: ChangeCodeType, newDate: string) {
      // Update effective dates for all items with the specified change code
      this.groupedData = this.groupedData.map(item => {
        if (item.changeCode === changeCode) {
          return { ...item, effectiveDate: newDate };
        }
        return item;
      });
      this.saveToLocalStorage();
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
      
      this.saveToLocalStorage();
    },
    
    // Bulk update effective dates for records (replaces the database operation)
    updateEffectiveDatesWithRecords(updatedRecords: {name: string, prefix: string, effective: string}[]) {
      if (!updatedRecords || updatedRecords.length === 0) {
        console.log('No records to update');
        return;
      }
      
      console.log(`Updating ${updatedRecords.length} records in store`);
      
      // Create a quick lookup map for the updates
      const updateMap = new Map<string, string>();
      for (const record of updatedRecords) {
        updateMap.set(`${record.name}|${record.prefix}`, record.effective);
      }
      
      // Apply updates to original data
      this.originalData = this.originalData.map(record => {
        const key = `${record.name}|${record.prefix}`;
        const newEffectiveDate = updateMap.get(key);
        
        if (newEffectiveDate) {
          return {
            ...record,
            effective: newEffectiveDate
          };
        }
        
        return record;
      });
      
      this.saveToLocalStorage();
      console.log(`Successfully updated ${updatedRecords.length} records in store`);
    },
    
    // Process CSV data directly in the store
    processFileData(csvData: any[], columnMapping: Record<string, number>): { records: RateSheetRecord[], invalidRows: InvalidRow[] } {
      const validRecords: RateSheetRecord[] = [];
      const invalidRowsFound: InvalidRow[] = [];
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      csvData.forEach((row, index) => {
        // Extract values
        const name = row[columnMapping.name]?.trim() || '';
        const prefix = row[columnMapping.prefix]?.trim() || '';
        const rateStr = row[columnMapping.rate];
        
        // Auto-generate effective date as today - no longer read from file
        const effective = today;
        
        // Auto-set changeCode to SAME for newly imported records
        const changeCode: ChangeCodeType = ChangeCode.SAME;
        
        // Parse optional fields
        let minDuration: number | undefined;
        let increments: number | undefined;

        if (columnMapping.minDuration >= 0) {
          const minDurationStr = row[columnMapping.minDuration]?.trim();
          if (minDurationStr && !isNaN(Number(minDurationStr))) {
            minDuration = Number(minDurationStr);
          }
        }

        if (columnMapping.increments >= 0) {
          const incrementsStr = row[columnMapping.increments]?.trim();
          if (incrementsStr && !isNaN(Number(incrementsStr))) {
            increments = Number(incrementsStr);
          }
        }

        // Parse and validate the rate
        const rate = parseFloat(rateStr);
        if (isNaN(rate) || !name || !prefix) {
          const invalidRow: InvalidRow = {
            destinationName: name || `Row ${index + 1}`,
            prefix: prefix || 'Missing',
            invalidRate: rateStr || 'Missing',
            rowNumber: index + 1
          };
          invalidRowsFound.push(invalidRow);
        } else {
          validRecords.push({
            name,
            prefix,
            rate,
            effective,
            changeCode,
            ...(minDuration !== undefined && { minDuration }),
            ...(increments !== undefined && { increments }),
          });
        }
      });
      
      return { records: validRecords, invalidRows: invalidRowsFound };
    },
    
    // Process records into groups (moved from service to store)
    processRecordsIntoGroups(records: RateSheetRecord[]): GroupedRateData[] {
      // Group records by destination name
      const groupedByName = new Map<string, RateSheetRecord[]>();
      records.forEach(record => {
        const existing = groupedByName.get(record.name) || [];
        groupedByName.set(record.name, [...existing, record]);
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

        // Determine if there's a discrepancy (more than one unique rate)
        const hasDiscrepancy = rateMap.size > 1;
        
        // Add debug logging to check rate conflicts
        if (hasDiscrepancy) {
          console.log(`Rate conflict detected for ${name}: ${Array.from(rateMap.keys()).join(', ')}`);
        }

        return {
          destinationName: name,
          codes: records.map(r => r.prefix),
          rates,
          hasDiscrepancy,
          effectiveDate: records[0]?.effective || new Date().toISOString().split('T')[0],
          changeCode: records[0]?.changeCode || ChangeCode.SAME as ChangeCodeType,
          minDuration: records[0]?.minDuration,
          increments: records[0]?.increments,
        };
      });
    },
    
    // Create a method to process a CSV file directly
    processRateSheetData(records: RateSheetRecord[]): void {
      // Set the data
      this.originalData = records;
      
      // Process the data into groups
      this.groupedData = this.processRecordsIntoGroups(records);
      
      // Set isLocallyStored to true since we now have data
      this.isLocallyStored = true;
      
      // Call this for compatibility, but it won't actually save to localStorage
      this.saveToLocalStorage();
    },
    
    // Load data from localStorage on app initialization - disabled, no persistence between sessions
    loadFromLocalStorage() {
      // Persistence disabled - data will not be loaded from previous sessions
      console.debug('Data persistence is disabled - starting with fresh state');
      return false; // Always return false to indicate no data was loaded
    },
    
    // Save data to localStorage - disabled, no persistence between sessions
    saveToLocalStorage() {
      // Persistence disabled - data will not be saved between browser refreshes
      console.debug('Data persistence is disabled - changes will not be saved between refreshes');
    },
    
    // Save invalid rows to localStorage - disabled, no persistence between sessions
    saveInvalidRowsToLocalStorage() {
      // Persistence disabled - invalid rows will not be saved between browser refreshes
    }
  },

  getters: {
    getDiscrepancyCount: (state): number => {
      const count = state.groupedData.filter(group => group.hasDiscrepancy).length;
      console.log(`Destinations with rate discrepancies: ${count}`);
      return count;
    },

    getTotalRecords: (state): number => {
      return state.originalData.length;
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
    },
    
    hasMinDuration(state): boolean {
      return state.optionalFields.hasMinDuration;
    },
    
    hasIncrements(state): boolean {
      return state.optionalFields.hasIncrements;
    },
    
    hasStoredData(state): boolean {
      return state.originalData.length > 0;
    }
  },
});
