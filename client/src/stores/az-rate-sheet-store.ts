import { defineStore } from 'pinia';
import { markRaw } from 'vue';
import { ChangeCode } from '@/types/domains/rate-sheet-types';
import type {
  RateSheetState,
  RateSheetRecord,
  GroupedRateData,
  RateStatistics,
  InvalidRow,
  ChangeCodeType,
  EffectiveDateStoreSettings,
  RateBucketType,
} from '@/types/domains/rate-sheet-types';
import { classifyRateIntoBucket, isRateInBucket } from '@/constants/rate-buckets';

// Note: AZ Rate Sheet uses memory-only storage (no persistence)

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
      increaseCustomDate: (() => {
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return weekFromNow.toISOString().split('T')[0];
      })(),
      decreaseCustomDate: new Date().toISOString().split('T')[0],
    },
    optionalFields: {
      hasMinDuration: false,
      hasIncrements: false,
    },
    selectedRateBucket: 'all' as RateBucketType,
    operationInProgress: false,
    excludedDestinations: new Set<string>(),
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
      // Use markRaw to prevent Vue from making the data deeply reactive
      this.groupedData = markRaw(data) as GroupedRateData[];
    },

    setOriginalData(data: RateSheetRecord[]) {
      const today = new Date().toISOString().split('T')[0];

      // Process the data first
      const processedData = data.map((record) => ({
        ...record,
        effective: record.effective || today,
        changeCode: record.changeCode || ChangeCode.SAME,
      }));

      // Use markRaw to prevent Vue from making the data deeply reactive
      this.originalData = markRaw(processedData) as RateSheetRecord[];
    },

    setOptionalFields(mappings: Record<string, string>) {
      this.optionalFields = {
        hasMinDuration: Object.values(mappings).includes('minDuration'),
        hasIncrements: Object.values(mappings).includes('increments'),
      };
      // Memory-only storage - no persistence
    },

    // Operation state management
    setOperationInProgress(inProgress: boolean) {
      this.operationInProgress = inProgress;
    },

    // Add a method to trigger updates when components need reactivity
    triggerDataUpdate() {
      // Force reactivity update by creating a new array reference
      // This is more efficient than deep reactivity for large datasets
      this.groupedData = [...this.groupedData];
    },

    // Rate update methods
    async updateDestinationRate(destinationName: string, newRate: number): Promise<boolean> {
      try {
        // Check if this destination has rate conflicts (discrepancy)
        const destinationGroup = this.groupedData.find(group => group.destinationName === destinationName);
        const hasDiscrepancy = destinationGroup?.hasDiscrepancy || false;

        // Update original data with change codes and effective dates
        const updatedOriginalData = this.originalData.map((record) => {
          if (record.name === destinationName) {
            let changeCode: ChangeCodeType;
            let effectiveDate: string;
            
            if (hasDiscrepancy) {
              // This is conflict resolution/formalization - keep as SAME
              changeCode = ChangeCode.SAME;
              effectiveDate = this.effectiveDateSettings.sameCustomDate;
            } else {
              // This is a true rate adjustment - determine change code based on rate comparison
              if (newRate > record.rate) {
                changeCode = ChangeCode.INCREASE;
                effectiveDate = this.effectiveDateSettings.increaseCustomDate;
              } else if (newRate < record.rate) {
                changeCode = ChangeCode.DECREASE;
                effectiveDate = this.effectiveDateSettings.decreaseCustomDate;
              } else {
                changeCode = ChangeCode.SAME;
                effectiveDate = this.effectiveDateSettings.sameCustomDate;
              }
            }

            return {
              ...record,
              rate: newRate,
              changeCode,
              effective: effectiveDate,
            };
          }
          return record;
        });

        // Use markRaw when setting the updated data
        this.originalData = markRaw(updatedOriginalData) as RateSheetRecord[];

        // Update grouped data
        const updatedGroupedData = this.processRecordsIntoGroups(this.originalData);
        this.groupedData = markRaw(updatedGroupedData) as GroupedRateData[];

        // Trigger update for components that need it
        this.triggerDataUpdate();

        return true;
      } catch (error) {
        console.error('Failed to update destination rate:', error);
        return false;
      }
    },

    async bulkUpdateDestinationRates(updates: { name: string; rate: number }[]): Promise<boolean> {
      try {
        // Create a map for faster lookups
        const updateMap = new Map(updates.map((update) => [update.name, update.rate]));

        // Create a map of destinations with discrepancies for faster lookups
        const discrepancyMap = new Map(
          this.groupedData.map(group => [group.destinationName, group.hasDiscrepancy])
        );

        // Update original data with change codes and effective dates
        const updatedOriginalData = this.originalData.map((record) => {
          const newRate = updateMap.get(record.name);
          if (newRate !== undefined) {
            const hasDiscrepancy = discrepancyMap.get(record.name) || false;
            let changeCode: ChangeCodeType;
            let effectiveDate: string;
            
            if (hasDiscrepancy) {
              // This is conflict resolution/formalization - keep as SAME
              changeCode = ChangeCode.SAME;
              effectiveDate = this.effectiveDateSettings.sameCustomDate;
            } else {
              // This is a true rate adjustment - determine change code based on rate comparison
              if (newRate > record.rate) {
                changeCode = ChangeCode.INCREASE;
                effectiveDate = this.effectiveDateSettings.increaseCustomDate;
              } else if (newRate < record.rate) {
                changeCode = ChangeCode.DECREASE;
                effectiveDate = this.effectiveDateSettings.decreaseCustomDate;
              } else {
                changeCode = ChangeCode.SAME;
                effectiveDate = this.effectiveDateSettings.sameCustomDate;
              }
            }

            return {
              ...record,
              rate: newRate,
              changeCode,
              effective: effectiveDate,
            };
          }
          return record;
        });

        // Use markRaw when setting the updated data
        this.originalData = markRaw(updatedOriginalData) as RateSheetRecord[];

        // Update grouped data
        const updatedGroupedData = this.processRecordsIntoGroups(this.originalData);
        this.groupedData = markRaw(updatedGroupedData) as GroupedRateData[];

        // Trigger update for components that need it
        this.triggerDataUpdate();

        return true;
      } catch (error) {
        console.error('Failed to bulk update rates:', error);
        return false;
      }
    },

    clearData() {
      this.originalData = [];
      this.groupedData = [];
      this.isLocallyStored = false;
      this.invalidRows = [];
      this.selectedRateBucket = 'all';
      this.excludedDestinations.clear();
      
      // Force reactivity update to ensure components are notified
      this.triggerDataUpdate();
      
      // Memory-only storage - no persistence to clear
    },

    addInvalidRow(row: InvalidRow) {
      this.invalidRows.push(row);
    },

    clearInvalidRows() {
      this.invalidRows = [];
    },

    setEffectiveDateSettings(settings: EffectiveDateStoreSettings) {
      this.effectiveDateSettings = { ...settings };
      // Memory-only storage - no persistence
    },

    updateEffectiveDates(changeCode: ChangeCodeType, newDate: string) {
      // Update effective dates for all items with the specified change code
      const updatedGroupedData = this.groupedData.map((item) => {
        if (item.changeCode === changeCode) {
          return { ...item, effectiveDate: newDate };
        }
        return item;
      });

      this.groupedData = markRaw(updatedGroupedData) as GroupedRateData[];
      this.triggerDataUpdate();
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
      const updatedGroupedData = this.groupedData.map((group) => {
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

      this.groupedData = markRaw(updatedGroupedData) as GroupedRateData[];
      this.triggerDataUpdate();
    },

    // Bulk update effective dates for records (replaces the database operation)
    updateEffectiveDatesWithRecords(
      updatedRecords: { name: string; prefix: string; effective: string }[]
    ) {
      if (!updatedRecords || updatedRecords.length === 0) {
        return;
      }

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
      const updatedOriginalData = this.originalData.map((record) => {
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

      this.originalData = markRaw(updatedOriginalData) as RateSheetRecord[];
      this.triggerDataUpdate();
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
      // For chunked processing, accumulate records
      if (this.originalData.length > 0) {
        // Accumulate new chunk with existing data
        const combinedData = [...this.originalData, ...records];
        this.originalData = markRaw(combinedData) as RateSheetRecord[];
      } else {
        // First chunk or single processing
        this.originalData = markRaw(records) as RateSheetRecord[];
      }

      // Re-process all data into groups (optimized grouping will be done once at the end)
      const groupedData = this.processRecordsIntoGroups(this.originalData);
      this.groupedData = markRaw(groupedData) as GroupedRateData[];

      // Set isLocallyStored to true since we now have data
      this.isLocallyStored = true;

      // Memory-only storage - no persistence needed
    },

    // Optimized method for complete data processing (no incremental grouping)
    processRateSheetDataComplete(records: RateSheetRecord[]): void {
      // Set all data at once with markRaw for optimal memory usage
      this.originalData = markRaw(records) as RateSheetRecord[];

      // Process the data into groups once
      const groupedData = this.processRecordsIntoGroups(records);
      this.groupedData = markRaw(groupedData) as GroupedRateData[];

      // Set isLocallyStored to true since we now have data
      this.isLocallyStored = true;

      // Memory-only storage - no persistence needed
    },


    isDestinationExcluded(destinationName: string): boolean {
      return this.excludedDestinations.has(destinationName);
    },

    addExcludedDestination(destinationName: string): void {
      this.excludedDestinations.add(destinationName);
    },

    removeExcludedDestination(destinationName: string): void {
      this.excludedDestinations.delete(destinationName);
    },

    clearExcludedDestinations(): void {
      this.excludedDestinations.clear();
    },

    // Add rate bucket filter methods
    setRateBucketFilter(bucket: RateBucketType) {
      this.selectedRateBucket = bucket;
      // Memory-only storage - no persistence
    },

    loadRateBucketFilter() {
      // Memory-only storage - filter resets on page refresh
      // this.selectedRateBucket remains at default 'all'
    },
  },

  getters: {
    getDiscrepancyCount: (state): number => {
      const count = state.groupedData.filter((group) => group.hasDiscrepancy).length;
      return count;
    },

    getTotalRecords: (state): number => {
      return state.originalData.length;
    },

    getDestinationsByStatus: (state) => (hasDiscrepancy: boolean) =>
      state.groupedData.filter((group) => group.hasDiscrepancy === hasDiscrepancy),

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

    // New getters for AZ Rate Sheet Advanced Filtering & Markup

    getFilteredByRateBucket(state) {
      if (state.selectedRateBucket === 'all') {
        return state.groupedData;
      }

      return state.groupedData.filter((group) => {
        // For destinations with conflicts, check all rates
        if (group.hasDiscrepancy) {
          return group.rates.some((rate) => isRateInBucket(rate.rate, state.selectedRateBucket));
        }
        // For single-rate destinations, check the single rate
        return isRateInBucket(group.rates[0]?.rate || 0, state.selectedRateBucket);
      });
    },

    canUseBucketAdjustments(state) {
      return state.groupedData.filter((group) => group.hasDiscrepancy).length === 0;
    },

    canExport(state) {
      // Block export until conflicts resolved
      return state.groupedData.filter((group) => group.hasDiscrepancy).length === 0;
    },
  },
});
