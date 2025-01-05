import { BaseService } from '@/domains/shared/types/services';
import { LERGRecord, LERGProcessingResult } from '../types/types';
import { lergApiService } from './lerg-api.service';

export class LergProcessingService implements BaseService {
  private worker: Worker | null = null;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'lerg_db';
  private readonly DB_VERSION = 1;

  async initialize(): Promise<void> {
    try {
      console.log('Testing connection to LERG service...');
      await lergApiService.testConnection();
      console.log('Connection test successful, initializing worker...');

      this.worker = new Worker(new URL('../workers/lerg-processing.worker.ts', import.meta.url), { type: 'module' });
      console.log('Worker initialized, setting up IndexedDB...');

      await this.initIndexedDB();
      console.log('IndexedDB setup complete');
    } catch (error) {
      console.error('Failed to initialize LERG service:', {
        error,
        workerStatus: this.worker ? 'initialized' : 'not initialized',
        dbStatus: this.db ? 'connected' : 'not connected',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `LERG service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(new Error('IndexedDB access denied'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('lerg_codes')) {
          db.createObjectStore('lerg_codes', { keyPath: 'npanxx' });
        }

        if (!db.objectStoreNames.contains('special_codes')) {
          db.createObjectStore('special_codes', { keyPath: 'npa' });
        }
      };
    });
  }

  async syncDataToIndexedDB(): Promise<void> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      const worker = this.worker;
      if (!worker) return reject(new Error('Worker not initialized'));

      const messageHandler = (event: MessageEvent) => {
        const { type, error } = event.data;
        if (type === 'sync_complete') {
          worker.removeEventListener('message', messageHandler);
          resolve();
        } else if (type === 'error') {
          worker.removeEventListener('message', messageHandler);
          reject(new Error(error));
        }
      };

      worker.addEventListener('message', messageHandler);
      worker.postMessage({ type: 'sync_data' });
    });
  }

  async processLERGFile(file: File): Promise<LERGProcessingResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      if (!this.worker) return reject(new Error('Worker not initialized'));

      this.worker.onmessage = async event => {
        const { type, data, progress, error } = event.data;

        switch (type) {
          case 'progress':
            // Handle progress updates
            console.log(`Processing: ${progress}%`);
            break;

          case 'complete':
            resolve(data);
            break;

          case 'error':
            reject(new Error(error));
            break;
        }
      };

      this.worker.onerror = error => {
        reject(new Error(`Worker error: ${error.message}`));
      };

      this.worker.postMessage({
        type: 'process',
        file,
        batchSize: 1000,
      });
    });
  }

  async getStats(): Promise<{ totalRecords: number; lastUpdated: string | null }> {
    return lergApiService.getStats();
  }
}
