import Dexie from 'dexie';
import { LERGRecord, LERGStats, LergWorkerResponse, LERGService, SpecialAreaCode } from '@/types/lerg-types';
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
        lergApiService.getLergData().catch(error => {
          console.error('Failed to fetch LERG codes:', error);
          return [];
        }),
        lergApiService.getSpecialCodesData().catch(error => {
          console.error('Failed to fetch special codes:', error);
          return [];
        }),
      ]);

      if (lergData.length === 0 && specialCodes.length === 0) {
        console.log('No data received, attempting reload...');
        await lergApiService.reloadSpecialCodes();
        // Retry fetch after reload
        const reloadedSpecialCodes = await lergApiService.getSpecialCodesData();
        if (reloadedSpecialCodes.length === 0) {
          throw new Error('Failed to fetch any data from server');
        }
      }

      // Process and store data
      if (lergData.length > 0) {
        await this.storeLergData(lergData);
      }

      if (specialCodes.length > 0) {
        const formattedSpecialCodes = specialCodes.map((code: SpecialAreaCode) => ({
          npa: code.npa,
          country: code.country,
          description: code.province || '',
        }));
        await this.storeSpecialCodes(formattedSpecialCodes);
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
    // Verify data is stored before setting flag
    const count = await this.db.table('lerg').count();
    this.store.setLergLocallyStored(count > 0);
  }

  private async storeSpecialCodes(data: any[]): Promise<void> {
    console.log('Storing special codes in Dexie:', data);
    try {
      // Clear existing data first
      await this.db.table('special_area_codes').clear();
      await this.db.table('special_area_codes').bulkPut(
        data.map((code: SpecialAreaCode) => ({
          id: undefined,
          npa: code.npa,
          country: code.country,
          description: code.province,
          last_updated: new Date().toISOString(),
        }))
      );
      console.log('Successfully stored special codes');
      const count = await this.db.table('special_area_codes').count();
      console.log('Number of special codes stored:', count);
    } catch (error) {
      console.error('Failed to store special codes:', error);
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
    this.store.$patch(state => {
      state.lerg = {
        isProcessing: false,
        isLocallyStored: true,
        stats: {
          totalRecords: data.length,
          lastUpdated: new Date().toISOString(),
        },
      };
    });
    const count = await this.db.table('lerg').count();
    console.log('Count of LERG records:', count);
    this.store.setLergLocallyStored(true);
  }

  private handleProcessingError(error: string | Error) {
    const errorMessage = error instanceof Error ? error.message : error;
    this.store.$patch(state => {
      state.lerg.isProcessing = false;
      state.error = errorMessage;
      state.lerg.stats = {
        totalRecords: 0,
        lastUpdated: new Date().toISOString(),
      };
    });
  }

  async initializeLergTable(lergData: LERGRecord[]): Promise<void> {
    try {
      console.log('Initializing LERG table with records:', lergData?.length);
      await this.db.table('lerg').clear();
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
}
