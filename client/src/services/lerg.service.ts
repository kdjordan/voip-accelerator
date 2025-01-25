import Dexie from 'dexie';
import { LERGRecord, LERGStats, LergWorkerResponse, LERGService } from '@/types/lerg-types';
import { useLergStore } from '@/stores/lerg-store';
import { lergApiService } from './lerg-api.service';
import { DBConfig, createDatabase } from '@/config/database';

export class LergService implements LERGService {
  private worker: Worker;
  private store = useLergStore();
  private db: Dexie;

  constructor() {
    this.worker = new Worker(new URL('../workers/lerg-worker.ts', import.meta.url), { type: 'module' });
    this.setupWorkerHandlers();
    this.db = createDatabase(DBConfig.LERG);
  }

  // Public API
  async initialize(): Promise<void> {
    try {
      await this.initializeLergData();
    } catch (error) {
      console.error('Failed to initialize LERG service:', error);
      throw error;
    }
  }

  async initializeLergData() {
    try {
      // Check connection
      await lergApiService.testConnection();

      // Get data from PostgreSQL
      const lergData = await lergApiService.getAllLergCodes();
      const specialCodes = await lergApiService.getAllSpecialCodes();

      // Process with worker
      this.worker.postMessage({
        type: 'process',
        data: { lergData, specialCodes },
        batchSize: 1000,
      });
    } catch (error) {
      console.error('Failed to initialize LERG data:', error);
      throw error;
    }
  }

  async getStats(): Promise<LERGStats> {
    return lergApiService.getStats();
  }

  // Admin operations
  async uploadLergFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return lergApiService.uploadLERGFile(formData);
  }

  // Private implementation
  private setupWorkerHandlers() {
    this.worker.onmessage = (event: MessageEvent<LergWorkerResponse>) => {
      switch (event.data.type) {
        case 'progress':
          this.store.$patch({ progress: event.data.progress });
          break;
        case 'complete':
          if (event.data.data) {
            this.handleProcessingComplete(event.data.data);
          }
          break;
        case 'error':
          if (event.data.error) {
            this.handleProcessingError(event.data.error);
          }
          break;
      }
    };
  }

  private async handleProcessingComplete(data: LERGRecord[]) {
    await this.db.table('lerg').bulkPut(data);
    this.store.$patch({
      isProcessing: false,
      stats: {
        totalRecords: data.length,
        lastUpdated: new Date().toISOString(),
      },
    });
  }
  private handleProcessingError(error: Error) {
    this.store.$patch(state => {
      state.isProcessing = false;
      state.progress = 0;
      state.error = error.message;
      state.stats = {
        totalRecords: 0,
        lastUpdated: new Date().toISOString(),
      };
    });
  }
}
