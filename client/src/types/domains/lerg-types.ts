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
  provinces?: Array<{
    code: string;
    npas: string[];
  }>;
}

// Extended Store types for NPA-focused implementation
export interface NpaRecord {
  npa: string;
  state: string;
  country: string;
}

export type NpaMap = Map<string, NpaRecord>;
export type CountryNpaMap = Map<string, Set<string>>;
export type StateNpaMap = Map<string, Set<string>>;
export type CountryStateNpaMap = Map<string, Map<string, Set<string>>>;

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
  // New properties for NPA-focused implementation
  npaRecords?: NpaMap;
  countriesMap?: CountryNpaMap;
  countryStateMap?: CountryStateNpaMap;
}

export interface LergDataResponse {
  data: LERGRecord[];
  stats: {
    totalRecords: number;
    lastUpdated: string | null;
  };
}

// Reuse same structure but with 'code' instead of 'name' for states
export interface StateWithNPAs {
  code: string;
  country?: string;
  npas: string[];
}

export const LERG_COLUMN_ROLES = {
  NPA: 'NPA',
  NXX: 'NXX',
  STATE: 'State',
  COUNTRY: 'Country',
} as const;

export type LergColumnRole = keyof typeof LERG_COLUMN_ROLES;

export const LERG_COLUMN_ROLE_OPTIONS = Object.entries(LERG_COLUMN_ROLES).map(([key, label]) => ({
  value: key as LergColumnRole,
  label,
}));

export interface LergPreviewData {
  columns: string[];
  data: string[][];
  columnRoles: Record<string, LergColumnRole>;
  startLine: number;
}

export interface LergColumnMapping {
  [key: string]: LergColumnRole;
}

// Data provider interface for abstraction
export interface LergDataProvider {
  getNpaRecord(npa: string): NpaRecord | undefined;
  getStateByNpa(npa: string): { country: string; state: string } | null;
  getCountryByNpa(npa: string): string | null;
  getNpasByCountry(country: string): Set<string>;
  getNpasByState(country: string, state: string): Set<string>;
  isValidNpa(npa: string): boolean;
}

// Worker-compatible data structure for efficient transfer
export interface LergWorkerData {
  validNpas: string[];
  npaMappings: Record<string, { country: string; state: string }>;
  countryGroups: Record<string, string[]>;
}

// LERG Data Processing Implementation Types
export interface NPAEntry {
  npa: string;
  meta?: {
    lastUpdated?: Date;
    source?: string;
  };
}

// Use Maps instead of plain objects for better performance and type safety
export type USStateNPAMap = Map<string, NPAEntry[]>;
export type CanadaProvinceNPAMap = Map<string, NPAEntry[]>;
export type CountryNPAMap = Map<string, NPAEntry[]>;

export interface LERGStateInterface {
  // Core data maps
  usStates: USStateNPAMap;
  canadaProvinces: CanadaProvinceNPAMap;
  otherCountries: CountryNPAMap;

  // Status tracking
  isLoaded: boolean;
  isProcessing: boolean;
  error: string | null;

  // Statistics
  stats: {
    totalNPAs: number;
    countriesCount: number;
    usTotalNPAs: number;
    canadaTotalNPAs: number;
    lastUpdated: Date | null;
  };
}
