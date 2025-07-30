// Rate Generation Types

export interface RateGenRecord {
  id?: number;
  prefix: string;           // 6-digit NPANXX (leading "1" stripped during upload)
  providerId: string;       // Provider identifier (UUID)
  providerName: string;     // User-defined provider name (max 20 chars)
  fileName: string;         // Original filename for reference
  rateInter: number;        // Interstate rate
  rateIntra: number;        // Intrastate rate
  rateIndeterminate: number; // Indeterminate rate
  uploadDate: Date;
}

export interface RateGenColumnMapping {
  npanxx?: number;          // Combined NPANXX column index
  npa?: number;             // Separate NPA column index
  nxx?: number;             // Separate NXX column index
  rateInter: number;        // Interstate rate column (required)
  rateIntra: number;        // Intrastate rate column (required)
  rateIndeterminate?: number; // Optional indeterminate rate column
}

export interface ProviderInfo {
  id: string;               // Provider UUID
  name: string;             // User-defined name
  fileName: string;         // Original file name
  rowCount: number;         // Number of valid records
  invalidRowCount: number;  // Number of invalid records
  uploadDate: Date;
  avgInterRate: number;     // Average interstate rate
  avgIntraRate: number;     // Average intrastate rate
  avgIndeterminateRate: number; // Average indeterminate rate
}

export type LCRStrategy = 'LCR1' | 'LCR2' | 'LCR3' | 'LCR4' | 'LCR5' | 'Average';

export interface LCRConfig {
  name?: string;
  strategy: LCRStrategy;
  markupPercentage: number;
  markupFixed?: number;
  providerIds: string[];
  effectiveDate?: Date;
}

export interface GeneratedRateDeck {
  id: string;
  name: string;
  lcrStrategy: LCRStrategy;
  markupPercentage: number;
  markupFixed?: number;
  providerIds: string[];
  generatedDate: Date;
  rowCount: number;
  exportFormat?: 'csv' | 'excel';
}

export interface GeneratedRateRecord {
  prefix: string;
  rate: number;             // Final interstate rate with markup
  intrastate: number;       // Final intrastate rate with markup
  indeterminate: number;    // Final indeterminate rate with markup
  selectedProvider?: string; // Provider name that was selected
  appliedMarkup: number;    // Markup percentage applied
  debug?: {                 // Debug information for LCR validation
    strategy: LCRStrategy;
    providerRates: Array<{
      provider: string;
      interRate: number;
      intraRate: number;
      indeterminateRate: number;
    }>;
    selectedRates: {
      inter: { rate: number; provider: string };
      intra: { rate: number; provider: string };
      indeterminate: { rate: number; provider: string };
    };
    appliedMarkup: {
      type: 'fixed' | 'percentage';
      value: number;
      originalRates: {
        inter: number;
        intra: number;
        indeterminate: number;
      };
    };
  };
}

export interface RateGenAnalytics {
  generationId: string;
  strategy: LCRStrategy;
  markupPercentage: number;
  providerStats: {
    providerId: string;
    providerName: string;
    codesSelected: number;
    percentageOfTotal: number;
  }[];
  generatedDate: Date;
  totalCodes: number;
}

export interface InvalidRateGenRow {
  rowNumber: number;
  data: string[];
  reason: string;
}

// LCR Worker Types
export interface LCRWorkerMessage {
  type: 'calculate' | 'cancel';
  data?: {
    prefixRates: Array<{
      prefix: string;
      rates: RateGenRecord[];
    }>;
    strategy: LCRStrategy;
    markupPercentage: number;
  };
}

export interface LCRWorkerResponse {
  type: 'result' | 'error' | 'progress';
  data?: GeneratedRateRecord[];
  error?: string;
  progress?: number;
}

// Component IDs for Rate Gen upload zones
export type RateGenComponentId = 'provider1' | 'provider2' | 'provider3' | 'provider4' | 'provider5';

// Maximum number of providers allowed
export const MAX_PROVIDERS = 5;

// Default LCR strategies with descriptions
export const LCR_STRATEGIES = [
  { value: 'LCR1' as const, label: 'LCR 1 (Cheapest)', description: 'Select the lowest rate from all providers' },
  { value: 'LCR2' as const, label: 'LCR 2 (Second Best)', description: 'Select the second-lowest rate' },
  { value: 'LCR3' as const, label: 'LCR 3 (Third Best)', description: 'Select the third-lowest rate' },
  { value: 'Average' as const, label: 'Average Top 3', description: 'Calculate average of three lowest rates' }
] as const;