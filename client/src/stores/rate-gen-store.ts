import { defineStore } from 'pinia';
import type {
  ProviderInfo,
  LCRConfig,
  GeneratedRateDeck,
  RateGenComponentId,
  InvalidRateGenRow,
  RateGenRecord
} from '@/types/domains/rate-gen-types';

export const useRateGenStore = defineStore('rateGen', {
  state: () => ({
    // Provider management
    providers: {} as Record<string, ProviderInfo>,
    
    // Upload states
    uploadingComponents: {} as Record<RateGenComponentId, boolean>,
    uploadProgress: {} as Record<string, number>,
    uploadErrors: {} as Record<string, string>,
    
    // Generation states
    isGenerating: false,
    generationProgress: 0,
    currentConfig: null as LCRConfig | null,
    generatedDeck: null as GeneratedRateDeck | null,
    
    // Data management
    tempFiles: {} as Record<string, File>,
    invalidRows: {} as Record<string, InvalidRateGenRow[]>,
    inMemoryData: {} as Record<string, RateGenRecord[]>,
    
    // UI states
    showUploadComponents: true,
    errors: [] as string[],
  }),

  getters: {
    // Provider getters
    providerList: (state): ProviderInfo[] => Object.values(state.providers),
    
    providerCount: (state): number => Object.keys(state.providers).length,
    
    canGenerate: (state): boolean => 
      Object.keys(state.providers).length >= 2 && 
      state.currentConfig !== null && 
      !state.isGenerating,
    
    getProviderById: (state) => (providerId: string): ProviderInfo | undefined => 
      state.providers[providerId],
    
    // Upload getters
    isComponentUploading: (state) => (componentId: RateGenComponentId): boolean => 
      !!state.uploadingComponents[componentId],
    
    getUploadProgress: (state) => (providerId: string): number => 
      state.uploadProgress[providerId] || 0,
    
    getUploadError: (state) => (providerId: string): string | undefined => 
      state.uploadErrors[providerId],
    
    hasAnyUploadErrors: (state): boolean => 
      Object.keys(state.uploadErrors).length > 0,
    
    // Data getters
    getTempFile: (state) => (providerId: string): File | undefined => 
      state.tempFiles[providerId],
    
    getInvalidRows: (state) => (providerId: string): InvalidRateGenRow[] => 
      state.invalidRows[providerId] || [],
    
    hasInvalidRows: (state) => (providerId: string): boolean => {
      const rows = state.invalidRows[providerId];
      return !!(rows && rows.length > 0);
    },
    
    getInMemoryData: (state) => (providerId: string): RateGenRecord[] => 
      state.inMemoryData[providerId] || [],
    
    getInMemoryDataCount: (state) => (providerId: string): number => 
      state.inMemoryData[providerId]?.length || 0,
    
    // Configuration getters
    availableLCRStrategies: (state) => {
      const count = Object.keys(state.providers).length;
      const strategies = [];
      
      if (count >= 2) strategies.push('LCR1');
      if (count >= 2) strategies.push('LCR2'); 
      if (count >= 3) strategies.push('LCR3');
      if (count >= 3) strategies.push('Average');
      
      return strategies;
    },
    
    // Generation getters
    isProcessing: (state): boolean => 
      state.isGenerating || Object.values(state.uploadingComponents).some(Boolean),
  },

  actions: {
    // Provider actions
    addProvider(provider: ProviderInfo) {
      this.providers[provider.id] = provider;
    },
    
    removeProvider(providerId: string) {
      delete this.providers[providerId];
      delete this.uploadProgress[providerId];
      delete this.uploadErrors[providerId];
      delete this.tempFiles[providerId];
      delete this.invalidRows[providerId];
      delete this.inMemoryData[providerId];
      
      // Reset generation state if we have less than 2 providers
      if (Object.keys(this.providers).length < 2) {
        this.currentConfig = null;
        this.generatedDeck = null;
      }
    },
    
    clearAllProviders() {
      this.providers = {};
      this.uploadProgress = {};
      this.uploadErrors = {};
      this.tempFiles = {};
      this.invalidRows = {};
      this.inMemoryData = {};
      this.currentConfig = null;
      this.generatedDeck = null;
      this.showUploadComponents = true;
    },
    
    // Upload actions
    setComponentUploading(componentId: RateGenComponentId, isUploading: boolean) {
      this.uploadingComponents[componentId] = isUploading;
    },
    
    setUploadProgress(providerId: string, progress: number) {
      const clampedProgress = Math.max(0, Math.min(100, progress));
      this.uploadProgress[providerId] = clampedProgress;
    },
    
    setUploadError(providerId: string, error: string | null) {
      if (error) {
        this.uploadErrors[providerId] = error;
      } else {
        delete this.uploadErrors[providerId];
      }
    },
    
    clearUploadError(providerId: string) {
      delete this.uploadErrors[providerId];
    },
    
    // Data management actions
    setTempFile(providerId: string, file: File) {
      this.tempFiles[providerId] = file;
    },
    
    clearTempFile(providerId: string) {
      delete this.tempFiles[providerId];
    },
    
    addInvalidRow(providerId: string, row: InvalidRateGenRow) {
      if (!this.invalidRows[providerId]) {
        this.invalidRows[providerId] = [];
      }
      this.invalidRows[providerId].push(row);
    },
    
    clearInvalidRowsForProvider(providerId: string) {
      delete this.invalidRows[providerId];
    },
    
    storeInMemoryData(providerId: string, data: RateGenRecord[]) {
      this.inMemoryData[providerId] = data;
    },
    
    removeInMemoryData(providerId: string) {
      delete this.inMemoryData[providerId];
    },
    
    // Configuration actions
    setConfig(config: LCRConfig) {
      this.currentConfig = config;
    },
    
    clearConfig() {
      this.currentConfig = null;
    },
    
    // Generation actions
    setGenerating(isGenerating: boolean) {
      this.isGenerating = isGenerating;
    },
    
    setGenerationProgress(progress: number) {
      this.generationProgress = Math.max(0, Math.min(100, progress));
    },
    
    setGeneratedDeck(deck: GeneratedRateDeck) {
      this.generatedDeck = deck;
    },
    
    clearGeneratedDeck() {
      this.generatedDeck = null;
      this.generationProgress = 0;
    },
    
    // Error management
    addError(error: string) {
      this.errors.push(error);
    },
    
    removeError(index: number) {
      this.errors.splice(index, 1);
    },
    
    clearErrors() {
      this.errors = [];
    },
    
    // UI actions
    setShowUploadComponents(show: boolean) {
      this.showUploadComponents = show;
    },
    
    // Utility actions
    reset() {
      this.clearAllProviders();
      this.clearErrors();
      this.generationProgress = 0;
      this.isGenerating = false;
      this.showUploadComponents = true;
      
      // Clear all upload states
      Object.keys(this.uploadingComponents).forEach(key => {
        this.uploadingComponents[key as RateGenComponentId] = false;
      });
    },
    
    // Get next available component slot
    getNextAvailableSlot(): RateGenComponentId | null {
      const slots: RateGenComponentId[] = ['provider1', 'provider2', 'provider3', 'provider4', 'provider5'];
      
      for (const slot of slots) {
        if (!this.isComponentUploading(slot) && !Object.values(this.providers).some(p => p.id === slot)) {
          return slot;
        }
      }
      
      return null;
    },
  },
});