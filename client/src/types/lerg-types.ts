// Core LERG data type
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
  error?: string;
  progress?: number;
  processed?: number;
  total?: number;
  data?: LERGRecord[];
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
  error: string | null;
  lerg: {
    isProcessing: boolean;
    progress: number;
    isLocallyStored: boolean;
    stats: {
      totalRecords: number;
      lastUpdated: string | null;
    };
  };
  specialCodes: {
    isProcessing: boolean;
    progress: number;
    isLocallyStored: boolean;
    data: SpecialAreaCode[];
    stats: {
      totalCodes: number;
      lastUpdated: string | null;
      countryBreakdown: Array<{
        countryCode: string;
        count: number;
      }>;
    };
  };
}

export interface SpecialAreaCode {
  npa: string;
  country: string;
  description: string; // server sends 'province'
  last_updated: string; // server doesn't send this
}
