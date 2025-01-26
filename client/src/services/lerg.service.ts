import Dexie from 'dexie';
import { LERGRecord, LERGStats, LergWorkerResponse, LERGService } from '@/types/lerg-types';
import { useLergStore } from '@/stores/lerg-store';
import { lergApiService } from './lerg-api.service';
import { DBConfig, createDatabase } from '@/config/database';

const MAX_RETRIES = 3;

export class LergService implements LERGService {
  private worker: Worker | null = null;
  private store = useLergStore();
  private db: Dexie;

  constructor() {
    console.log('Initializing LERG service with database:', DBConfig.LERG.name);
    this.db = createDatabase(DBConfig.LERG);
    // Initialize worker after DB is ready
    this.initializeWorker();
  }

  private async initializeWorker() {
    try {
      if (this.worker) {
        this.worker.terminate();
      }

      this.worker = new Worker(new URL('../workers/lerg.worker.ts', import.meta.url), {
        type: 'module',
        name: 'lerg-worker',
      });

      if (this.worker) {
        this.setupWorkerHandlers();
      }
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      this.worker = null;
    }
  }

  // Public API
  async initialize(): Promise<void> {
    try {
      await this.initializeData();
    } catch (error) {
      console.error('Failed to initialize LERG service:', error);
      throw error;
    }
  }

  // Required by LERGService interface
  async initializeLergData(): Promise<void> {
    return this.initializeData();
  }

  async initializeData(retryCount = 0): Promise<void> {
    try {
      console.log('Starting LERG service initialization...');
      // Get initial stats
      await this.getStats();

      // Check if data exists in PostgreSQL
      const hasData = await lergApiService.testConnection().catch(error => {
        console.error('Connection test failed:', error);
        return false;
      });

      console.log('PostgreSQL has data:', hasData);

      if (!hasData) {
        console.log('No LERG data found in PostgreSQL');
        // Attempt to reload special codes if no data found
        console.log('Attempting to reload special codes...');
        await lergApiService.reloadSpecialCodes();
        return;
      }

      console.log('Fetching LERG and special codes data...');
      // Fetch both LERG and special codes data
      const [lergData, specialCodes] = await Promise.all([
        lergApiService.getAllLergCodes().catch(error => {
          console.error('Failed to fetch LERG codes:', error);
          return [];
        }),
        lergApiService.getAllSpecialCodes().catch(error => {
          console.error('Failed to fetch special codes:', error);
          return [];
        }),
      ]);

      if (lergData.length === 0 && specialCodes.length === 0) {
        console.log('No data received, attempting reload...');
        await lergApiService.reloadSpecialCodes();
        // Retry fetch after reload
        const reloadedSpecialCodes = await lergApiService.getAllSpecialCodes();
        if (reloadedSpecialCodes.length === 0) {
          throw new Error('Failed to fetch any data from server');
        }
      }

      // Process and store data
      if (lergData.length > 0) {
        await this.storeLergData(lergData);
        this.store.setLocallyStored(true);
      }

      if (specialCodes.length > 0) {
        const formattedSpecialCodes = specialCodes.map(code => ({
          npa: code.npa,
          country: code.country,
          description: code.province || '',
        }));
        await this.storeSpecialCodes(formattedSpecialCodes);
        this.store.setSpecialCodesLocallyStored(true);
      }
    } catch (error) {
      console.error('Error initializing LERG data:', error);
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying initialization (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.initializeData(retryCount + 1);
      }
      throw error;
    }
  }

  private async storeLergData(data: LERGRecord[]): Promise<void> {
    await this.db.table('lerg').bulkPut(data);
  }

  private async storeSpecialCodes(data: any[]): Promise<void> {
    console.log('Storing special codes in Dexie:', data);
    try {
      // Clear existing data first
      await this.db.table('special_area_codes').clear();
      await this.db.table('special_area_codes').bulkPut(data);
      console.log('Successfully stored special codes');
      const count = await this.db.table('special_area_codes').count();
      console.log('Number of special codes stored:', count);
    } catch (error) {
      console.error('Failed to store special codes:', error);
      throw error;
    }
  }

  async getStats(): Promise<LERGStats> {
    try {
      const stats = await lergApiService.getStats();
      this.store.$patch({ stats });
      return stats;
    } catch (error) {
      console.error('Failed to fetch LERG stats:', error);
      throw error;
    }
  }

  // Admin operations
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

    this.worker.onerror = error => {
      console.error('Worker error:', error);
      this.handleProcessingError(new Error('Worker failed'));
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

  async initializeWithData(
    lergData: LERGRecord[],
    specialCodes: Array<{ npa: string; country: string; province: string }>
  ): Promise<void> {
    try {
      console.log('Starting data initialization...');

      // Store LERG data
      if (lergData.length > 0) {
        await this.storeLergData(lergData);
        this.store.setLocallyStored(true);
      }

      // Store special codes
      if (specialCodes.length > 0) {
        const formattedCodes = specialCodes.map(code => ({
          npa: code.npa,
          country: code.country,
          description: code.province || '',
        }));
        await this.storeSpecialCodes(formattedCodes);
        this.store.setSpecialCodesLocallyStored(true);
      }

      console.log('Data initialization complete');
    } catch (error) {
      console.error('Failed to initialize data:', error);
      throw error;
    }
  }
}
