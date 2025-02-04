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
  initialize(): Promise<void>;
  initializeLergData(): Promise<void>;
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
export interface LergState {
  error: string | null;
  lerg: {
    isProcessing: boolean;
    isLocallyStored: boolean;
    stats: {
      totalRecords: number;
      lastUpdated: string | null;
    };
  };
  specialCodes: {
    isProcessing: boolean;
    isLocallyStored: boolean;
    data: SpecialAreaCode[];
    stats: {
      totalCodes: number;
      lastUpdated: string | null;
      countryBreakdown: CountryBreakdown[];
    };
  };
}

export interface SpecialAreaCode {
  npa: string;
  country: string;
  province: string;
  last_updated: string; // optional since server doesn't always send this
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
