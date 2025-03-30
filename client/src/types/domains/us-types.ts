import type { CountryLergData } from '@/types/domains/lerg-types';

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

export interface USCodeReport {
  file1: USFileReport;
  file2: USFileReport;
  matchedCodes: number;
  nonMatchedCodes: number;
  matchedCodesPercentage: number;
  nonMatchedCodesPercentage: number;
  matchedNPAs?: number; // Number of NPAs that match between files
  totalUniqueNPAs?: number; // Total number of unique NPAs across both files
}

export interface USPricingReport {
  file1: {
    fileName: string;
    averageInterRate: number;
    averageIntraRate: number;
    averageIJRate: number;
    medianInterRate: number;
    medianIntraRate: number;
    medianIJRate: number;
  };
  file2: {
    fileName: string;
    averageInterRate: number;
    averageIntraRate: number;
    averageIJRate: number;
    medianInterRate: number;
    medianIntraRate: number;
    medianIJRate: number;
  };
  comparison: {
    interRateDifference: number;
    intraRateDifference: number;
    ijRateDifference: number;
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
  INDETERMINATE: 'ijRate',
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
}

export interface USCountryBreakdown {
  countryCode: string;
  countryName: string;
  npaCoverage: number;
  totalNPAs: number;
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
