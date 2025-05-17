import { defineStore } from 'pinia';
import { ChangeCode } from '@/types/domains/rate-sheet-types';
import type {
  RateSheetState,
  RateSheetRecord,
  GroupedRateData,
  RateStatistics,
  InvalidRow,
  ChangeCodeType,
  EffectiveDateStoreSettings,
} from '@/types/domains/rate-sheet-types';

const STORAGE_KEY = 'voip-accelerator-rate-sheet-data';
const STORAGE_KEY_SETTINGS = 'voip-accelerator-rate-sheet-settings';
const STORAGE_KEY_INVALID = 'voip-accelerator-rate-sheet-invalid';

export const useAzRateSheetStore = defineStore('azRateSheet', {
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
      decreaseCustomDate: new Date().toISOString().split('T')[0],
    },
    optionalFields: {
      hasMinDuration: false,
      hasIncrements: false,
    },
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

      this.originalData = data.map((record) => ({
        ...record,
        effective: record.effective || today,
        changeCode: record.changeCode || ChangeCode.SAME,
      }));
      this.saveToLocalStorage();
    },

    setOptionalFields(mappings: Record<string, string>) {
      this.optionalFields = {
        hasMinDuration: Object.values(mappings).includes('minDuration'),
        hasIncrements: Object.values(mappings).includes('increments'),
      };
      localStorage.setItem('rate-sheet-optional-fields', JSON.stringify(this.optionalFields));
    },

    async updateDestinationRate(destinationName: string, newRate: number) {
      // const today = new Date().toISOString().split('T')[0]; // Not needed as a local default here

      // Get all records for this destination to determine the appropriate change code
      const records = this.originalData.filter((record) => record.name === destinationName);
      if (records.length === 0) return false;

      // Determine the most appropriate change code based on rate comparison
      let hasIncrease = false;
      let hasDecrease = false;
      for (const record of records) {
        if (newRate > record.rate) {
          hasIncrease = true;
          break; // Prioritize INCREASE
        } else if (newRate < record.rate) {
          hasDecrease = true;
        }
      }

      let changeCode: ChangeCodeType = ChangeCode.SAME; // Default
      if (hasIncrease) {
        changeCode = ChangeCode.INCREASE;
      } else if (hasDecrease) {
        changeCode = ChangeCode.DECREASE;
      }
      // If neither, changeCode remains SAME, which is the default initial value.

      // Calculate effectiveDate using the determined changeCode and current store settings
      const effectiveDate = this.calculateEffectiveDateForChangeCode(changeCode);

      console.log(
        `Updating destination: ${destinationName}, ChangeCode: ${changeCode}, EffectiveDate: ${effectiveDate}`
      );

      // Update all records for this destination with the consistent change code and effective date
      this.originalData = this.originalData.map((record) =>
        record.name === destinationName
          ? {
              ...record,
              rate: newRate,
              changeCode: changeCode,
              effective: effectiveDate,
            }
          : record
      );
      this.saveToLocalStorage();

      // Update grouped data
      const updatedGroupedData = this.groupedData.map((group) => {
        if (group.destinationName === destinationName) {
          // Rebuild the rates statistics
          const recordsForDestination = this.originalData.filter((r) => r.name === destinationName);
          const totalRecords = recordsForDestination.length;

          // Since we've just unified the rate, we'll have only one rate with 100% usage
          const rates: RateStatistics[] = [
            {
              rate: newRate,
              count: totalRecords,
              percentage: 100,
              isCommon: true,
            },
          ];

          return {
            ...group,
            rates,
            hasDiscrepancy: false,
            changeCode: changeCode,
            effectiveDate: effectiveDate,
          };
        }
        return group;
      });

      this.groupedData = updatedGroupedData;
      this.saveToLocalStorage();

      return true;
    },

    // High-performance bulk update for handling multiple destinations at once
    async bulkUpdateDestinationRates(updates: { name: string; rate: number }[]) {
      const today = new Date().toISOString().split('T')[0];

      // Create a map for quick lookups of new rates
      const updateMap = new Map<string, number>();
      for (const update of updates) {
        updateMap.set(update.name, update.rate);
      }

      // First collect all destinations and their new rates
      const destinationsToUpdate = new Set<string>();
      updates.forEach((update) => destinationsToUpdate.add(update.name));

      // Pre-compute change codes and effective dates by destination
      const changeCodeByDestination = new Map<string, ChangeCodeType>();
      const effectiveDateByDestination = new Map<string, string>();

      // Calculate the appropriate change code and effective date for each destination
      for (const destination of destinationsToUpdate) {
        const newRate = updateMap.get(destination) || 0;

        // Get all records for this destination to determine the change code
        const records = this.originalData.filter((record) => record.name === destination);
        if (records.length === 0) continue;

        // Determine the most appropriate change code based on rate comparison
        // If ANY records show an increase, use INCREASE
        // Otherwise, if ANY records show a decrease, use DECREASE
        // Otherwise, use SAME
        let hasIncrease = false;
        let hasDecrease = false;

        for (const record of records) {
          if (newRate > record.rate) {
            hasIncrease = true;
            break; // Prioritize INCREASE
          } else if (newRate < record.rate) {
            hasDecrease = true;
          }
        }

        let determinedChangeCode: ChangeCodeType = ChangeCode.SAME;
        let determinedEffectiveDate = today;

        // Use effectiveDateSettings from the store to determine the date
        if (hasIncrease) {
          determinedChangeCode = ChangeCode.INCREASE;
          determinedEffectiveDate = this.calculateEffectiveDateForChangeCode(ChangeCode.INCREASE);
        } else if (hasDecrease) {
          determinedChangeCode = ChangeCode.DECREASE;
          determinedEffectiveDate = this.calculateEffectiveDateForChangeCode(ChangeCode.DECREASE);
        } else {
          determinedChangeCode = ChangeCode.SAME;
          determinedEffectiveDate = this.calculateEffectiveDateForChangeCode(ChangeCode.SAME);
        }

        // Store the consistent values for this destination
        changeCodeByDestination.set(destination, determinedChangeCode);
        effectiveDateByDestination.set(destination, determinedEffectiveDate);

        console.log(
          `Bulk Prep Destination: ${destination}, ChangeCode: ${determinedChangeCode}, EffectiveDate: ${determinedEffectiveDate}`
        );
      }

      // Single pass through the originalData array for maximum efficiency
      this.originalData = this.originalData.map((record) => {
        if (destinationsToUpdate.has(record.name)) {
          const newRate = updateMap.get(record.name);
          if (newRate === undefined) return record;

          // Use the pre-computed consistent change code and effective date for this destination
          const changeCode = changeCodeByDestination.get(record.name) || ChangeCode.SAME;
          const effectiveDate = effectiveDateByDestination.get(record.name) || today;

          return {
            ...record,
            rate: newRate,
            changeCode: changeCode,
            effective: effectiveDate,
          };
        }
        return record;
      });

      // Update grouped data in a single efficient operation
      const updatedGroupedData: GroupedRateData[] = [];
      const processedDestinations = new Set<string>();

      for (const group of this.groupedData) {
        if (
          destinationsToUpdate.has(group.destinationName) &&
          !processedDestinations.has(group.destinationName)
        ) {
          const newRateForGroup = updateMap.get(group.destinationName);
          if (newRateForGroup === undefined) {
            updatedGroupedData.push(group); // Should not happen if destinationsToUpdate is accurate
            processedDestinations.add(group.destinationName);
            continue;
          }

          const recordsForDestination = this.originalData.filter(
            (r) => r.name === group.destinationName
          );
          const totalRecords = recordsForDestination.length;

          // New rates statistics
          const rates: RateStatistics[] = [
            {
              rate: newRateForGroup,
              count: totalRecords,
              percentage: 100,
              isCommon: true,
            },
          ];

          updatedGroupedData.push({
            ...group,
            rates,
            hasDiscrepancy: false,
            changeCode: changeCodeByDestination.get(group.destinationName) || ChangeCode.SAME,
            effectiveDate: effectiveDateByDestination.get(group.destinationName) || today,
          });
          processedDestinations.add(group.destinationName);
        } else if (!processedDestinations.has(group.destinationName)) {
          updatedGroupedData.push(group);
          processedDestinations.add(group.destinationName);
        }
      }
      this.groupedData = updatedGroupedData;
      this.saveToLocalStorage();

      return true;
    },

    // Helper to calculate effective date based on current store settings
    calculateEffectiveDateForChangeCode(changeCode: ChangeCodeType): string {
      const settings = this.effectiveDateSettings;
      const today = new Date();
      let effectiveDate = new Date(today); // Create a new Date object to avoid modifying 'today'

      // Helper to format date as YYYY-MM-DD
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      if (changeCode === ChangeCode.SAME) {
        if (settings.same === 'today') {
          // effectiveDate is already today
        } else if (settings.same === 'tomorrow') {
          effectiveDate.setDate(today.getDate() + 1);
        } else if (settings.same === 'custom') {
          return settings.sameCustomDate; // Return directly as it's already formatted
        }
      } else if (changeCode === ChangeCode.INCREASE) {
        if (settings.increase === 'today') {
          // effectiveDate is already today
        } else if (settings.increase === 'tomorrow') {
          effectiveDate.setDate(today.getDate() + 1);
        } else if (settings.increase === 'week') {
          effectiveDate.setDate(today.getDate() + 7);
        } else if (settings.increase === 'custom') {
          return settings.increaseCustomDate; // Return directly
        }
      } else if (changeCode === ChangeCode.DECREASE) {
        if (settings.decrease === 'today') {
          // effectiveDate is already today
        } else if (settings.decrease === 'tomorrow') {
          effectiveDate.setDate(today.getDate() + 1);
        } else if (settings.decrease === 'custom') {
          return settings.decreaseCustomDate; // Return directly
        }
      }
      return formatDate(effectiveDate);
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

    setEffectiveDateSettings(settings: EffectiveDateStoreSettings) {
      this.effectiveDateSettings = { ...settings };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.effectiveDateSettings));
    },

    updateEffectiveDates(changeCode: ChangeCodeType, newDate: string) {
      // Update effective dates for all items with the specified change code
      this.groupedData = this.groupedData.map((item) => {
        if (item.changeCode === changeCode) {
          return { ...item, effectiveDate: newDate };
        }
        return item;
      });
      this.saveToLocalStorage();
    },

    // Method to update grouped data with effective dates from worker
    updateGroupedDataEffectiveDates(
      updatedGroups: {
        destinationName: string;
        effectiveDate: string;
        changeCode: ChangeCodeType;
      }[]
    ) {
      // Create a lookup map for efficient updates
      const updateMap = new Map<string, { effectiveDate: string; changeCode: ChangeCodeType }>();

      // Build the lookup map
      updatedGroups.forEach((group) => {
        updateMap.set(group.destinationName, {
          effectiveDate: group.effectiveDate,
          changeCode: group.changeCode,
        });
      });

      // Update the grouped data
      this.groupedData = this.groupedData.map((group) => {
        const update = updateMap.get(group.destinationName);
        if (update) {
          return {
            ...group,
            effectiveDate: update.effectiveDate,
            changeCode: update.changeCode,
          };
        }
        return group;
      });

      this.saveToLocalStorage();
    },

    // Bulk update effective dates for records (replaces the database operation)
    updateEffectiveDatesWithRecords(
      updatedRecords: { name: string; prefix: string; effective: string }[]
    ) {
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

      // Get the change code by destination
      const changeCodesByDestination = new Map<string, ChangeCodeType>();
      for (const group of this.groupedData) {
        changeCodesByDestination.set(group.destinationName, group.changeCode);
      }

      // Apply updates to original data
      this.originalData = this.originalData.map((record) => {
        const key = `${record.name}|${record.prefix}`;
        const newEffectiveDate = updateMap.get(key);

        if (newEffectiveDate) {
          // Also update any UI-related properties that show the change code
          const changeCode = changeCodesByDestination.get(record.name) || record.changeCode;

          return {
            ...record,
            effective: newEffectiveDate,
            changeCode: changeCode,
          };
        }

        return record;
      });

      this.saveToLocalStorage();
      console.log(`Successfully updated ${updatedRecords.length} records in store`);
    },

    // Process CSV data directly in the store
    processFileData(
      csvData: any[],
      columnMapping: Record<string, number>
    ): { records: RateSheetRecord[]; invalidRows: InvalidRow[] } {
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
            rowNumber: index + 1,
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
      records.forEach((record) => {
        const existing = groupedByName.get(record.name) || [];
        groupedByName.set(record.name, [...existing, record]);
      });

      return Array.from(groupedByName.entries()).map(([name, records]) => {
        const rateMap = new Map<number, number>();
        records.forEach((record) => {
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

        const maxCount = Math.max(...rates.map((r) => r.count));
        rates.forEach((rate) => {
          rate.isCommon = rate.count === maxCount;
        });

        // Determine if there's a discrepancy (more than one unique rate)
        const hasDiscrepancy = rateMap.size > 1;

        // Add debug logging to check rate conflicts
        if (hasDiscrepancy) {
          console.log(
            `Rate conflict detected for ${name}: ${Array.from(rateMap.keys()).join(', ')}`
          );
        }

        return {
          destinationName: name,
          codes: records.map((r) => r.prefix),
          rates,
          hasDiscrepancy,
          effectiveDate: records[0]?.effective || new Date().toISOString().split('T')[0],
          changeCode: records[0]?.changeCode || (ChangeCode.SAME as ChangeCodeType),
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
    },
  },

  getters: {
    getDiscrepancyCount: (state): number => {
      const count = state.groupedData.filter((group) => group.hasDiscrepancy).length;
      console.log(`Destinations with rate discrepancies: ${count}`);
      return count;
    },

    getTotalRecords: (state): number => {
      return state.originalData.length;
    },

    getDestinationsByStatus: (state) => (hasDiscrepancy: boolean) =>
      state.groupedData.filter((group) => group.hasDiscrepancy === hasDiscrepancy),

    getGroupedData: (state): GroupedRateData[] => {
      const groupedByName = new Map<string, RateSheetRecord[]>();

      state.originalData.forEach((record) => {
        const records = groupedByName.get(record.name) || [];
        records.push(record);
        groupedByName.set(record.name, records);
      });

      return Array.from(groupedByName.entries()).map(([name, records]) => {
        const rateMap = new Map<number, number>();
        records.forEach((record) => {
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

        const maxCount = Math.max(...rates.map((r) => r.count));
        rates.forEach((rate) => {
          rate.isCommon = rate.count === maxCount;
        });

        const effectiveDate = records[0]?.effective || '';
        const changeCode: ChangeCodeType = records[0]?.changeCode || ChangeCode.SAME;

        return {
          destinationName: name,
          codes: records.map((r) => r.prefix),
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

    getGroupedInvalidRows: (state) => {
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

    getEffectiveDateSettings: (state): EffectiveDateStoreSettings => {
      return state.effectiveDateSettings;
    },

    getEffectiveDateForChangeCode:
      (state) =>
      (changeCode: ChangeCodeType): string => {
        const { same, increase, decrease, sameCustomDate, increaseCustomDate, decreaseCustomDate } =
          state.effectiveDateSettings;
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
    },
  },
});
