import type { BaseService } from './service-types';

// Core LERG data types
export interface LERGRecord {
  npanxx: string;
  state: string;
  npa: string;
  nxx: string;
}

// Service interfaces
export interface LERGService {
  initialize(): Promise<void>;
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
    countryBreakdown: Array<{
      countryCode: string;
      count: number;
    }>;
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

export interface LergState {
  isProcessing: boolean;
  progress: number;
  error: string | null;
  isLocallyStored: boolean;
  specialCodesLocallyStored: boolean;
  stats: LERGStats;
}
