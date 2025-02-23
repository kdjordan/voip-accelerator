import { defineStore } from 'pinia';
import { COUNTRY_CODES } from '@/types/country-codes';
export const useLergStore = defineStore('lerg', {
    state: () => ({
        error: null,
        isProcessing: false,
        isLocallyStored: false,
        stateNPAs: {},
        countryData: [],
        stats: {
            totalRecords: 0,
            lastUpdated: null,
        },
    }),
    actions: {
        setLergLocallyStored(value) {
            this.isLocallyStored = value;
        },
        setStateNPAs(stateNPAs) {
            this.stateNPAs = stateNPAs;
        },
        setCountryData(countryData) {
            this.countryData = countryData;
        },
        setLergStats(totalRecords) {
            this.stats.totalRecords = totalRecords;
            this.stats.lastUpdated = new Date().toISOString();
        },
        setError(error) {
            this.error = error;
        },
    },
    getters: {
        sortedStatesWithNPAs: (state) => {
            return Object.entries(state.stateNPAs)
                .filter(([code, npas]) => {
                return (!COUNTRY_CODES[code] ||
                    (code === 'CA' && state.countryData.find(c => c.country === 'US')?.npas.some(npa => npas.includes(npa))));
            })
                .map(([code, npas]) => ({
                code,
                country: 'US',
                npas: [...npas].sort(),
            }))
                .sort((a, b) => b.npas.length - a.npas.length);
        },
        getStateNPACount: state => (stateCode) => {
            return state.stateNPAs[stateCode]?.length || 0;
        },
        getTotalStates: (state) => {
            return Object.keys(state.stateNPAs).length;
        },
        getCountryData: (state) => {
            const territoryData = Object.entries(state.stateNPAs)
                .filter(([code]) => COUNTRY_CODES[code])
                .map(([code, npas]) => ({
                country: code,
                npaCount: npas.length,
                npas: [...npas].sort(),
            }));
            return [...territoryData, ...state.countryData].sort((a, b) => b.npaCount - a.npaCount);
        },
        getCountryByCode: state => (countryCode) => state.countryData.find(country => country.country === countryCode),
        getTotalNPAs: (state) => state.countryData.reduce((sum, country) => sum + country.npaCount, 0),
        getCountryCount: (state) => state.countryData.length,
    },
});
