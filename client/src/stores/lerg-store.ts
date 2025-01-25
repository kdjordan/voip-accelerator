import { defineStore } from 'pinia';
import type { LergState } from '@/types/lerg-types';

export const useLergStore = defineStore('lerg', {
  state: (): LergState => ({
    isProcessing: false,
    progress: 0,
    error: null,
    isLocallyStored: false,
    specialCodesLocallyStored: false,
    stats: {
      totalRecords: 0,
      lastUpdated: null,
    },
  }),

  actions: {
    setLocallyStored(value: boolean) {
      console.log('Setting LERG locally stored:', value);
      this.isLocallyStored = value;
    },

    setSpecialCodesLocallyStored(value: boolean) {
      console.log('Setting special codes locally stored:', value);
      this.specialCodesLocallyStored = value;
    },

    $patch(partialState: Partial<LergState>) {
      console.log('Patching store with:', partialState);
      Object.assign(this, partialState);
    },

    async processLergFile(file: File) {
      try {
        this.isProcessing = true;
        // TODO: Implement file processing logic
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error';
      } finally {
        this.isProcessing = false;
      }
    },
  },
});
