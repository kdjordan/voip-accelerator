// Core LERG data types
export interface LERGRecord {
  npanxx: string;
  state: string;
  npa: string;
  nxx: string;
}

export interface CountryBreakdown {
  countryCode: string;
  count: number;
  npaCodes: string[];
}

// Service interfaces
export interface LERGService {
  uploadLergFile(file: File): Promise<void>;
}

// API types
export interface LERGStats {
  totalRecords: number;
  lastUpdated: string | null;
  specialCodes?: {
    totalCodes: number;
    countryBreakdown: CountryBreakdown[];
  };
}

export interface LERGUploadResponse {
  processedRecords: number;
  totalRecords: number;
}

// Worker types
export interface StateWorkerMessage {
  type: 'process';
  data: LERGRecord[];
  batchSize?: number;
}

export interface StateWorkerResponse {
  type: 'complete' | 'error' | 'progress';
  error?: string;
  data?: StateNPAMapping;
  progress?: number;
  processed?: number;
  total?: number;
}

export interface LergWorkerResponse {
  type: 'complete' | 'error' | 'progress';
  error?: string;
  data?: LERGRecord[];
  progress?: number;
  processed?: number;
  total?: number;
}

export interface LergLoadingStatus {
  isLoading: boolean;
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

// Store state types
export interface StateNPAMapping {
  [state: string]: string[];
}

export interface LergState {
  error: string | null;
  lerg: {
    isProcessing: boolean;
    isLocallyStored: boolean;
    stateNPAs: StateNPAMapping;
    stats: {
      totalRecords: number;
      lastUpdated: string | null;
    };
  };
}

export interface SpecialAreaCode {
  npa: string;
  country: string;
  province: string;
  last_updated: string;
}

export interface LergDataResponse {
  data: LERGRecord[];
  stats: {
    totalRecords: number;
    lastUpdated: string | null;
  };
}

export interface SpecialCodesDataResponse {
  data: SpecialAreaCode[];
  stats: {
    totalCodes: number;
    lastUpdated: string | null;
    countryBreakdown: CountryBreakdown[];
  };
}

export interface CountryWithNPAs {
  name: string;
  npas: string[];
}

// Reuse same structure but with 'code' instead of 'name' for states
export type StateWithNPAs = {
  code: string;
  npas: string[];
};
