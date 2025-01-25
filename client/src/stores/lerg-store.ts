import { defineStore } from 'pinia';

interface LergState {
  isProcessing: boolean;
  progress: number;
  error: string | null;
  stats: {
    totalRecords: number;
    lastUpdated: string | null;
  };
}

export const useLergStore = defineStore('lerg', {
  state: (): LergState => ({
    isProcessing: false,
    progress: 0,
    error: null,
    stats: {
      totalRecords: 0,
      lastUpdated: null,
    },
  }),

  actions: {
    async processLergFile(file: File) {
      // TODO: Implement file processing logic
    },

    async getStats() {
      // TODO: Implement stats fetching
    },
  },
});
