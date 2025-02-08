// Core LERG data types
export interface LERGRecord {
  state: string;
  npa: string;
  country: string;
  last_updated?: Date;
}

// API types
export interface LERGStats {
  totalRecords: number;
  lastUpdated: Date;
}

export interface LERGUploadResponse {
  processedRecords: number;
  totalRecords: number;
}

export interface LergLoadingStatus {
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

// Store state types
export interface StateNPAMapping {
  [state: string]: string[];
}

export interface CountryBreakdown {
  countryCode: string;
  count: number;
  npaCodes: string[];
}

export interface LergStats {
  totalRecords: number;
  lastUpdated: string | null;
}

export interface CountryLergData {
  country: string;
  npaCount: number;
  npas: string[];
}

export interface LergState {
  error: string | null;
  isProcessing: boolean;
  isLocallyStored: boolean;
  stateNPAs: StateNPAMapping;
  countryData: CountryLergData[];
  stats: {
    totalRecords: number;
    lastUpdated: string | null;
  };
}

export interface LergDataResponse {
  data: LERGRecord[];
  stats: {
    totalRecords: number;
    lastUpdated: string | null;
  };
}

// Reuse same structure but with 'code' instead of 'name' for states
export type StateWithNPAs = {
  code: string;
  npas: string[];
};
