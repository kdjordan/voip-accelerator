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
  npaCount: number;         // Distinct NPAs in this deck (for LERG coverage %)
}

export type LCRStrategy = 'LCR1' | 'LCR2' | 'LCR3' | 'LCR4' | 'LCR5' | 'LCR6' | 'Average';

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
  effectiveDate?: Date;
  rowCount: number;
  exportFormat?: 'csv' | 'excel';
}

/**
 * Lean generated record held in memory (session-only, never persisted).
 * The heavy per-record `debug` block of GeneratedRateRecord is dropped after
 * aggregation; only the three per-rate-type winner names are kept (they feed
 * the Route Distribution CSV). Rates are post-markup.
 */
export interface LeanGeneratedRecord {
  prefix: string;
  rate: number;             // Final interstate rate (post-markup)
  intrastate: number;       // Final intrastate rate (post-markup)
  indeterminate: number;    // Final indeterminate rate (post-markup)
  interProvider: string;    // Provider name selected for interstate
  intraProvider: string;    // Provider name selected for intrastate
  indetProvider: string;    // Provider name selected for indeterminate
  appliedMarkup: number;    // Markup value applied (fixed amount or percentage)
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

// Export Types
export interface RateGenExportOptions {
  // Format options
  npanxxFormat: 'combined' | 'split';     // 213555 vs 213|555
  includeCountryCode: boolean;             // Include +1 prefix
  
  // Geographic columns
  includeStateColumn: boolean;             // Add state column
  includeCountryColumn: boolean;           // Add country column
  includeRegionColumn: boolean;            // Add region column
  
  // Filtering
  selectedCountries: string[];             // Countries to exclude
  excludeCountries: boolean;               // Exclusion mode
  
  // Provider information
  includeProviderColumn: boolean;          // Show selected provider
  includeCalculationDetails: boolean;      // Debug information
}

// Enhanced rate record with geographic data
export interface EnhancedGeneratedRate extends GeneratedRateRecord {
  npa?: string;           // First 3 digits of prefix
  state?: string;         // State/Province name
  stateCode?: string;     // State/Province code
  country?: string;       // Country name
  countryCode?: string;   // Country code
  region?: string;        // Geographic region
  deckId?: string;        // Associated deck ID
  generatedDate?: Date;   // When rate was generated
}

/**
 * Per-provider win count + share for a single rate type (interstate /
 * intrastate / indeterminate). `percentage` is 0–100, share of priced prefixes.
 */
export interface ProviderWinStat {
  provider: string;
  count: number;
  percentage: number;
}

/**
 * Win rate by rate type — for each jurisdiction, the per-provider counts and
 * shares of prefixes where that provider is the selected (winning) source.
 * LCR selects each rate type independently, so winners can differ by type.
 */
export interface WinRateByType {
  interstate: ProviderWinStat[];
  intrastate: ProviderWinStat[];
  indeterminate: ProviderWinStat[];
}

/**
 * Aggregate analytics over a set of lean generated records (a scenario sample
 * or a committed deck). Pure-function output — see utils/rate-gen-aggregates.ts.
 */
export interface RateGenAnalytics {
  totalPrefixes: number;            // number of priced lean records
  winRateByType: WinRateByType;     // primary signal
  singleSourcedCount: number;       // prefixes only one selected provider quotes
  providersUsed: string[];          // distinct providers winning >= 1 selection
  avgInterstate: number;            // post-markup mean
  avgIntrastate: number;            // post-markup mean
  avgIndeterminate: number;         // post-markup mean
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

// Maximum number of providers allowed (browser holds all decks in memory during generation)
export const MAX_PROVIDERS = 5;

// Default LCR strategies with descriptions
export const LCR_STRATEGIES = [
  { value: 'LCR1' as const, label: 'LCR 1 (Cheapest)', description: 'Select the lowest rate from all providers' },
  { value: 'LCR2' as const, label: 'LCR 2 (Second Best)', description: 'Select the second-lowest rate' },
  { value: 'LCR3' as const, label: 'LCR 3 (Third Best)', description: 'Select the third-lowest rate' },
  { value: 'Average' as const, label: 'Average Top 3', description: 'Calculate average of three lowest rates' }
] as const;