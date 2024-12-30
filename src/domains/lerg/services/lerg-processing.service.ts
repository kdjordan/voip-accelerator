import { BaseService } from '@/domains/shared/types/services';
import { LERGRecord, LERGProcessingResult } from '../types/types';
import { DatabaseService } from '@/domains/shared/services/database.service';

export class LergProcessingService implements BaseService {
  private dbService: DatabaseService;
  private worker: Worker | null = null;

  constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  async initialize(): Promise<void> {
    try {
      await this.dbService.query('SELECT 1 FROM lerg_codes LIMIT 1');
      this.worker = new Worker(new URL('../workers/lerg-processing.worker.ts', import.meta.url), { type: 'module' });
    } catch (error) {
      console.error('Failed to initialize LERG service:', error);
      throw new Error('LERG service initialization failed');
    }
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

  async getStats(): Promise<{ totalRecords: number; lastUpdated: string }> {
    const query = `
      SELECT COUNT(*) as total, MAX(last_updated) as last_updated 
      FROM lerg_codes
    `;

    const result = await this.dbService.query(query);
    return {
      totalRecords: parseInt(result.rows[0].total),
      lastUpdated: result.rows[0].last_updated,
    };
  }
}
