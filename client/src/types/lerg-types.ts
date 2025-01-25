import type { BaseService } from './service-types';

// Core LERG data types
export interface LERGRecord {
  npanxx: string;
  state: string;
  npa: string;
  nxx: string;
}

// Service interfaces
export interface LERGService extends BaseService {
  initializeLergData(): Promise<void>;
  getStats(): Promise<LERGStats>;
  uploadLergFile(file: File): Promise<void>;
}

// API types
export interface LERGStats {
  totalRecords: number;
  lastUpdated: string | null;
  specialCodes?: {
    totalCodes: number;
    countryBreakdown: {
      countryCode: string;
      count: number;
    }[];
  };
}

export interface LERGUploadResponse {
  processedRecords: number;
  totalRecords: number;
}

// Worker types
export interface LergWorkerResponse {
  type: 'progress' | 'complete' | 'error';
  progress?: number;
  data?: LERGRecord[];
  error?: Error;
}

export interface LergLoadingStatus {
  isLoading: boolean;
  progress: number;
  error: Error | null;
  lastUpdated: Date | null;
}

// Column roles
export const LERGColumnRole = {
  NPA: 'npa',
  NXX: 'nxx',
  STATE: 'state',
} as const;

export type LERGColumnRoleType = (typeof LERGColumnRole)[keyof typeof LERGColumnRole];
