import { defineStore } from 'pinia';
export const useRateSheetStore = defineStore('rateSheet', {
    state: () => ({
        error: null,
        isProcessing: false,
        isLocallyStored: false,
        groupedData: [],
        originalData: [],
        hasEffectiveDate: false,
        hasMinDuration: false,
        hasIncrements: false,
    }),
    actions: {
        setError(error) {
            this.error = error;
        },
        setProcessing(isProcessing) {
            this.isProcessing = isProcessing;
        },
        setLocallyStored(isStored) {
            this.isLocallyStored = isStored;
        },
        setGroupedData(data) {
            this.groupedData = data;
        },
        setOriginalData(data) {
            this.originalData = data;
        },
        setOptionalFields(mappings) {
            this.hasEffectiveDate = 'effective' in mappings;
            this.hasMinDuration = 'minDuration' in mappings;
            this.hasIncrements = 'increments' in mappings;
            this.isLocallyStored = true;
        },
        async updateDestinationRate(destinationName, newRate) {
            // Update the store's original data
            this.originalData = this.originalData.map(record => record.name === destinationName ? { ...record, rate: newRate } : record);
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
        getDiscrepancyCount: (state) => state.groupedData.filter(group => group.hasDiscrepancy).length,
        getDestinationsByStatus: state => (hasDiscrepancy) => state.groupedData.filter(group => group.hasDiscrepancy === hasDiscrepancy),
        getGroupedData: (state) => {
            const groupedByName = new Map();
            // Group records by destination name
            state.originalData.forEach(record => {
                const records = groupedByName.get(record.name) || [];
                records.push(record);
                groupedByName.set(record.name, records);
            });
            // Process each group
            return Array.from(groupedByName.entries()).map(([name, records]) => {
                // Calculate rate statistics
                const rateMap = new Map();
                records.forEach(record => {
                    const rate = typeof record.rate === 'string' ? parseFloat(record.rate) : record.rate;
                    rateMap.set(rate, (rateMap.get(rate) || 0) + 1);
                });
                // Calculate total records for percentage
                const totalRecords = records.length;
                // Convert rate map to array of rate statistics
                const rates = Array.from(rateMap.entries()).map(([rate, count]) => ({
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
    },
});
