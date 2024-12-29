import { BaseService } from '@/domains/shared/types/services';

export interface LERGRecord {
  npa: string;
  nxx: string;
  state: string;
}

export interface LERGProcessingResult {
  records: LERGRecord[];
  totalProcessed: number;
  errors: string[];
}

export interface LERGProcessingService extends BaseService {
  processLERGFile(file: File): Promise<LERGProcessingResult>;
  validateRecord(record: string): LERGRecord | null;
  uploadBatch(records: LERGRecord[]): Promise<void>;
} 