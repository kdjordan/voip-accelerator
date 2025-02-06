import Dexie from 'dexie';
import {
  LERGRecord,
  LergWorkerResponse,
  LERGService,
  SpecialAreaCode,
  StateWorkerMessage,
  StateWorkerResponse,
} from '@/types/lerg-types';
import { useLergStore } from '@/stores/lerg-store';
import { lergApiService } from './lerg-api.service';
import { DBConfig, createDatabase } from '@/config/database';

const MAX_RETRIES = 3;

export class LergService implements LERGService {
  private worker: Worker | null = null;
  private stateWorker: Worker | null = null;
  private store = useLergStore();
  private db: Dexie;

  constructor() {
    console.log('Initializing LERG service with database:', DBConfig.LERG.name);
    this.db = createDatabase(DBConfig.LERG);
    this.initializeWorker();
  }

  private async initializeWorker() {
    try {
      if (this.worker) {
        this.worker.terminate();
      }
      if (this.stateWorker) {
        this.stateWorker.terminate();
      }

      this.worker = new Worker(new URL('../workers/lerg.worker.ts', import.meta.url), {
        type: 'module',
        name: 'lerg-worker',
      });

      this.stateWorker = new Worker(new URL('../workers/lerg-state.worker.ts', import.meta.url), {
        type: 'module',
        name: 'lerg-state-worker',
      });

      if (this.worker) {
        this.setupWorkerHandlers();
      }
      if (this.stateWorker) {
        this.setupStateWorkerHandlers();
      }
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      this.worker = null;
      this.stateWorker = null;
    }
  }

  private setupStateWorkerHandlers() {
    if (!this.stateWorker) return;

    this.stateWorker.onmessage = (event: MessageEvent<StateWorkerResponse>) => {
      console.log('🟢 State worker message received:', event.data.type);
      switch (event.data.type) {
        case 'complete':
          if (event.data.data) {
            console.log('🟢 State worker data before store update:', event.data.data);
            this.store.setStateNPAs(event.data.data);
            console.log('🟢 Store state after update:', this.store.lerg.stateNPAs);
          }
          break;
        case 'error':
          console.error('State worker error:', event.data.error);
          break;
        case 'progress':
          break;
      }
    };

    this.stateWorker.onerror = error => {
      console.error('State worker error:', error);
    };
  }

  // Public API
  async uploadLergFile(file: File): Promise<void> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    this.worker.postMessage({
      type: 'process',
      file,
      batchSize: 1000,
    });
  }

  // Private implementation
  private setupWorkerHandlers() {
    if (!this.worker) return;

    this.worker.onmessage = (event: MessageEvent<LergWorkerResponse>) => {
      switch (event.data.type) {
        case 'complete':
          if (event.data.data) {
            this.handleProcessingSuccess(event.data.data);
          }
          break;
        case 'error':
          if (event.data.error) {
            this.handleProcessingError(event.data.error);
          }
          break;
      }
    };

    this.worker.onerror = error => {
      console.error('Worker error:', error);
      this.handleProcessingError(new Error('Worker failed'));
    };
  }

  private async handleProcessingSuccess(data: LERGRecord[]) {
    console.log('Processing completed successfully');
    await this.db.table('lerg').bulkPut(data);

    if (this.stateWorker) {
      this.stateWorker.postMessage({
        type: 'process',
        data,
        batchSize: 1000,
      } as StateWorkerMessage);
    }

    this.store.setLergLocallyStored(true);
    this.store.setLergStats(data.length);

    const count = await this.db.table('lerg').count();
    console.log('Count of LERG records:', count);
  }

  private handleProcessingError(error: string | Error) {
    const errorMessage = error instanceof Error ? error.message : error;
    this.store.lerg.isProcessing = false;
    this.store.setError(errorMessage);
    this.store.setLergStats(0);
    this.store.setStateNPAs({}); // Reset state mappings on error
  }

  async initializeLergTable(lergData: LERGRecord[]): Promise<void> {
    try {
      console.log('Initializing LERG table with records:', lergData?.length);
      await this.db.table('lerg').clear();

      // Process state/NPA mappings with fresh PostgreSQL data
      if (this.stateWorker) {
        this.stateWorker.postMessage({
          type: 'process',
          data: lergData,
          batchSize: 1000,
        } as StateWorkerMessage);
      }

      await this.db.table('lerg').bulkPut(lergData);
      console.log('Data initialization completed successfully');
    } catch (error: unknown) {
      console.error('Failed to initialize data:', error);
      throw error;
    }
  }

  async initializeSpecialCodesTable(specialCodes: LERGRecord[]): Promise<void> {
    try {
      console.log('Initializing special codes table with records:', specialCodes?.length);
      await this.db.table('special_area_codes').clear();
      await this.db.table('special_area_codes').bulkPut(specialCodes);

      console.log('Data initialization completed successfully');
    } catch (error: unknown) {
      console.error('Failed to initialize data:', error);
      throw error;
    }
  }

  async getLergData(): Promise<LERGRecord[]> {
    return await this.db.table('lerg').toArray();
  }

  async getSpecialCodesData(): Promise<SpecialAreaCode[]> {
    return await this.db.table('special_area_codes').toArray();
  }

  async clearSpecialCodesData(): Promise<void> {
    try {
      console.log('Clearing special codes from IndexDB...');
      await this.db.table('special_area_codes').clear();
      console.log('Special codes cleared from IndexDB');
    } catch (error) {
      console.error('Failed to clear special codes from IndexDB:', error);
      throw error;
    }
  }

  async clearLergData(): Promise<void> {
    try {
      // Clear IndexDB
      await this.db.table('lerg').clear();
      console.log('IndexDB LERG data cleared');

      // Clear store
      const store = useLergStore();
      store.$patch({
        lerg: {
          isProcessing: false,
          isLocallyStored: false,
          stats: {
            totalRecords: 0,
            lastUpdated: null,
          },
        },
      });
    } catch (error) {
      console.error('Failed to clear LERG data:', error);
      throw error;
    }
  }
}
