import type { CountryLergData } from '@/types/domains/lerg-types';
// import type { InvalidUsRow, USStandardizedData } from './us-types'; // REMOVED redundant import
import type { ChangeCode } from './rate-sheet-types'; // Import ChangeCode

export interface USStandardizedData {
  npanxx: string;
  npa: string;
  nxx: string;
  interRate: number;
  intraRate: number;
  indetermRate: number;
}

export interface USReportsInput {
  fileName1: string;
  fileName2: string;
  file1Data: USStandardizedData[];
  file2Data: USStandardizedData[];
}

// Interface for invalid rows during file processing
export interface InvalidUsRow {
  rowIndex: number;
  npanxx: string;
  npa: string;
  nxx: string;
  interRate: number | string;
  intraRate: number | string;
  indetermRate: number | string;
  reason: string;
}

// Rate comparison result
export interface RateComparison {
  type: USRateType;
  difference: number;
  isHigher: boolean;
  isEqual: boolean;
}

// Rate statistics
export interface RateStats {
  average: number;
  median: number;
  min: number;
  max: number;
  count: number;
}

// Enhanced report types
export interface USFileReport {
  fileName: string;
  totalNPANXX: number;
  uniqueNPA: number;
  uniqueNXX: number;
  coveragePercentage: number;
  rateStats: {
    [key in USRateType]: RateStats;
  };
}

export interface USReportPayload {
  fileName1: string;
  fileName2: string;
  file1Data: USStandardizedData[];
  file2Data: USStandardizedData[];
}

export interface USReportResponse {
  pricing: any; // TODO: Define proper pricing report type
  code: any; // TODO: Define proper code report type
}

// Represents the data for a single margin bucket (e.g., <10%, 10-20%)
export interface MarginBucketDetail {
  matchInter: number; // Count of inter-state matches in this bucket
  percentInter: number; // Percentage of total comparable inter-state codes
  matchIntra: number; // Count of intra-state matches in this bucket
  percentIntra: number; // Percentage of total comparable intra-state codes
}

// Represents the full breakdown for either "SELL TO" or "BUY FROM"
export interface MarginAnalysis {
  lessThan10: MarginBucketDetail;
  between10And20: MarginBucketDetail;
  between20And30: MarginBucketDetail;
  between30And40: MarginBucketDetail;
  between40And50: MarginBucketDetail;
  between50And60: MarginBucketDetail;
  between60And70: MarginBucketDetail;
  between70And80: MarginBucketDetail;
  between80And90: MarginBucketDetail;
  between90And100: MarginBucketDetail;
  greaterThan100: MarginBucketDetail;
  totalInterMatches: number; // Sum of all inter-matches across buckets
  totalIntraMatches: number; // Sum of all intra-matches across buckets
  totalPercentInter: number; // Sum of all inter percentages
  totalPercentIntra: number; // Sum of all intra percentages
}

// Specific structure for the 0% margin scenario
export interface ZeroMarginDetail {
  matchInter: number;
  percentInter: number;
  matchIntra: number;
  percentIntra: number;
}

export interface USCodeReport {
  file1: USFileReport;
  file2: USFileReport;
  matchedCodes: number;
  nonMatchedCodes: number;
  matchedCodesPercentage: number;
  nonMatchedCodesPercentage: number;
  matchedNPAs?: number; // Number of NPAs that match between files
  totalUniqueNPAs?: number; // Total number of unique NPAs across both files

  // New fields for detailed margin analysis
  sellToAnalysis?: MarginAnalysis; // Optional because it requires two files
  buyFromAnalysis?: MarginAnalysis; // Optional
  zeroMarginDetail?: ZeroMarginDetail; // Optional
  totalComparableInterCodes?: number; // Total codes used as a base for inter %
  totalComparableIntraCodes?: number; // Total codes used as a base for intra %
}

export interface USPricingReport {
  file1: {
    fileName: string;
    averageInterRate: number;
    averageIntraRate: number;
    averageIndetermRate: number;
    medianInterRate: number;
    medianIntraRate: number;
    medianIndetermRate: number;
  };
  file2: {
    fileName: string;
    averageInterRate: number;
    averageIntraRate: number;
    averageIndetermRate: number;
    medianInterRate: number;
    medianIntraRate: number;
    medianIndetermRate: number;
  };
  comparison: {
    interRateDifference: number;
    intraRateDifference: number;
    indetermRateDifference: number;
    totalHigher: number;
    totalLower: number;
    totalEqual: number;
  };
}

// Rate type constants
export const USRateType = {
  INTERSTATE: 'interstate',
  INTRASTATE: 'intrastate',
  INDETERMINATE: 'indeterminate',
} as const;

export type USRateType = (typeof USRateType)[keyof typeof USRateType];

// Column roles for CSV mapping
export const USColumnRole = {
  NPA: 'npa',
  NXX: 'nxx',
  NPANXX: 'npanxx',
  INTERSTATE: 'interRate',
  INTRASTATE: 'intraRate',
  INDETERMINATE: 'indetermRate',
  SELECT: '',
} as const;

export type USColumnRole = (typeof USColumnRole)[keyof typeof USColumnRole];

export interface USColumnRoleOption {
  value: USColumnRole;
  label: string;
}

export const US_COLUMN_ROLE_OPTIONS: USColumnRoleOption[] = [
  { value: USColumnRole.NPANXX, label: 'NPANXX' },
  { value: USColumnRole.NPA, label: 'NPA' },
  { value: USColumnRole.NXX, label: 'NXX' },
  { value: USColumnRole.INTERSTATE, label: 'Interstate Rate' },
  { value: USColumnRole.INTRASTATE, label: 'Intrastate Rate' },
  { value: USColumnRole.INDETERMINATE, label: 'Indeterminate Rate' },
];

// Add missing type definitions
export type USColumnMappings = Record<string, USColumnRole>;

export interface USColumnsResult {
  columns: string[];
  mappings: USColumnMappings;
}

// Enhanced Code Report Types
export interface USEnhancedCodeReport {
  file1: USEnhancedFileReport;
  file2?: USEnhancedFileReport; // Optional for single file reports
}

export interface USEnhancedFileReport {
  fileName: string;
  totalCodes: number;
  countries: USCountryBreakdown[];
  rateStats?: {
    interstate: USRateStats;
    intrastate: USRateStats;
    indeterminate: USRateStats;
  };
}

export interface USCountryBreakdown {
  countryCode: string;
  countryName: string;
  npaCoverage: number;
  totalNPAs: number;
  npas: string[];
  states?: USStateBreakdown[]; // For US and Canada
}

export interface USStateBreakdown {
  stateCode: string;
  stateName: string;
  npas: string[];
  coverage: number;
  rateStats: {
    interstate: USRateStats;
    intrastate: USRateStats;
    indeterminate: USRateStats;
  };
}

export interface USRateStats {
  average: number;
  count: number;
  coverage: number;
}

// Enhanced Code Report Worker Input
export interface USEnhancedCodeReportInput {
  fileName: string;
  fileData: USStandardizedData[];
  lergData?: {
    stateNPAs: Record<string, string[]>;
    countryData: CountryLergData[];
  };
}

// US Comparison Types
export interface USComparisonData {
  dialCode: string;
  npa: string;
  destName: string;
  rateFile1: {
    interstate: number;
    intrastate: number;
    indeterminate: number;
  };
  rateFile2: {
    interstate: number;
    intrastate: number;
    indeterminate: number;
  };
  percentageDifference: {
    interstate: number;
    intrastate: number;
    indeterminate: number;
  };
}

export interface USNonMatchingCode {
  dialCode: string;
  npa: string;
  state: string;
  rates: {
    interstate: number;
    intrastate: number;
    indeterminate: number;
  };
  file: string;
}

/**
 * State for US file upload components
 */
export interface USFileUploadState {
  isGeneratingReports: boolean;
  showPreviewModal: boolean;
  previewData: string[][];
  columns: string[];
  startLine: number;
  activeComponent: 'us1' | 'us2';
  isModalValid: boolean;
  columnMappings: Record<string, string>;
  uploadError: Record<'us1' | 'us2', string | null>;
}

/**
 * Props and emits for US preview modal component
 */
export interface USPreviewModalProps {
  showModal: boolean;
  columns: string[];
  startLine: number;
  previewData: string[][];
  columnOptions: Array<{ value: string; label: string; required?: boolean }>;
  validateRequired?: boolean;
  source?: 'US' | 'US_RATE_DECK';
}

export interface USPreviewModalEmits {
  'update:mappings': [mappings: Record<string, string>];
  'update:valid': [isValid: boolean];
  'update:start-line': [startLine: number];
  'update:indeterminate-definition': [definition: string];
  confirm: [mappings: Record<string, string>, indeterminateDefinition?: string];
  cancel: [];
}

// Interface for the US Pricing Comparison Dexie table
export interface USPricingComparisonRecord {
  npanxx: string; // Primary key
  npa: string;
  nxx: string;
  stateCode: string;
  countryCode: string;

  // File 1 Rates
  file1_inter: number;
  file1_intra: number;
  file1_indeterm: number;

  // File 2 Rates
  file2_inter: number;
  file2_intra: number;
  file2_indeterm: number;

  // Percentage Differences (Relative to cheaper file)
  diff_inter_pct: number;
  diff_intra_pct: number;
  diff_indeterm_pct: number;

  // Cheaper file indicator per rate type
  cheaper_inter: 'file1' | 'file2' | 'same';
  cheaper_intra: 'file1' | 'file2' | 'same';
  cheaper_indeterm: 'file1' | 'file2' | 'same';
}

// Standardized data format for processed US rate sheet entries
export interface USRateSheetEntry {
  id?: number; // Primary key for Dexie
  npa: string;
  nxx: string;
  npanxx: string; // Derived from npa + nxx
  stateCode: string; // Added state code - derived from LERG
  interRate: number;
  intraRate: number;
  indetermRate: number; // Changed ijRate to indetermRate
  // Optional metadata/comparison fields
  effectiveDate?: string;

  // TBD: selectedRate and conflict might need rework for multiple rate types
  conflict?: boolean;
}

/*
export interface NPAAverageCost {
// ... existing code ...
*/
