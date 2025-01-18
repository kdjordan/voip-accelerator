import { defineStore } from 'pinia';

interface LergState {
  isProcessing: boolean;
  progress: number;
  stats: {
    totalRecords: number;
    lastUpdated: string;
  };
}

export const useLergStore = defineStore('lerg', {
  state: (): LergState => ({
    isProcessing: false,
    progress: 0,
    stats: {
      totalRecords: 0,
      lastUpdated: ''
    }
  }),

  actions: {
    async processLergFile(file: File) {
      // TODO: Implement file processing logic
    },

    async getStats() {
      // TODO: Implement stats fetching
    }
  }
}); 