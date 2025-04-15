export const AZ_DB_CONFIG = {
  version: 1,
  schema: '++id, destName, dialCode, rate',
} as const;

export interface IntCountryInfo {
  countryName: string;
  isoCode: string; // 2-letter ISO 3166-1 alpha-2 code
  dialCodes: string[]; // Array of international dial codes
}

export interface AZStandardizedData {
  id?: number;
  destName: string;
  dialCode: string;
  rate: number;
}

export interface AZReportsInput {
  fileName1: string;
  fileName2: string;
  file1Data: AZStandardizedData[];
  file2Data: AZStandardizedData[];
}

export interface AzPricingReport {
  higherRatesForFile1: ConsolidatedData[];
  higherRatesForFile2: ConsolidatedData[];
  sameRates: ConsolidatedData[];
  nonMatchingCodes: NonMatchingCode[];
  fileName1: string;
  fileName2: string;
}

export interface AzCodeReport {
  file1: {
    fileName: string;
    totalCodes: number;
    totalDestinations: number;
    uniqueDestinationsPercentage: number;
  };
  file2: {
    fileName: string;
    totalCodes: number;
    totalDestinations: number;
    uniqueDestinationsPercentage: number;
  };
  matchedCodes: number;
  nonMatchedCodes: number;
  matchedCodesPercentage: number;
  nonMatchedCodesPercentage: number;
}

export interface ConsolidatedData {
  dialCode: string;
  destName: string;
  rateFile1: number;
  rateFile2: number;
  percentageDifference: number;
}

export interface NonMatchingCode {
  dialCode: string;
  destName: string;
  rate: number;
  file: string;
}

export interface AZCSVRow {
  [key: string]: string;
}

export interface AZParseError {
  message: string;
  row?: number;
  type: string;
}

export interface AZParseResult {
  data: AZCSVRow[];
  errors: AZParseError[];
  meta: {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
  };
}

export interface ColumnRoleOption {
  value: AZColumnRole;
  label: string;
}

export const AZColumnRole = {
  DESTINATION: 'destName',
  DIALCODE: 'dialCode',
  RATE: 'rate',
  SELECT: '', // For "Select Column Role" option
} as const;

export type AZColumnRole = (typeof AZColumnRole)[keyof typeof AZColumnRole];

export const AZ_COLUMN_ROLE_OPTIONS: ColumnRoleOption[] = [
  { value: AZColumnRole.DESTINATION, label: 'Destination Name' },
  { value: AZColumnRole.DIALCODE, label: 'Dial Code' },
  { value: AZColumnRole.RATE, label: 'Rate' },
];

// For storing invalid rows in the store
export interface InvalidAzRow {
  rowIndex: number;
  destName: string;
  dialCode: string;
  invalidRate: string;
  reason: string;
}

// Code Report Types
export interface AzCodeReportFileInfo {
  fileName: string;
  totalCodes: number;
  totalDestinations: number;
  uniqueDestinationsPercentage: number;
}

export interface AzCodeReport {
  file1: AzCodeReportFileInfo;
  file2: AzCodeReportFileInfo;
  matchedCodes: number;
  nonMatchedCodes: number;
  matchedCodesPercentage: number;
  nonMatchedCodesPercentage: number;
}

// Pricing Report Types
export interface RateComparison {
  destName: string;
  dialCode: string;
  rateFile1: number;
  rateFile2: number;
  percentageDifference: number;
}

export interface NonMatchingCode {
  destName: string;
  dialCode: string;
  file: string;
}

export interface AzPricingReport {
  fileName1: string;
  fileName2: string;
  higherRatesForFile1: RateComparison[];
  higherRatesForFile2: RateComparison[];
  sameRates: RateComparison[];
  nonMatchingCodes: NonMatchingCode[];
}

/**
 * State for AZ file upload components
 */
export interface AZFileUploadState {
  isGeneratingReports: boolean;
  showPreviewModal: boolean;
  previewData: string[][];
  columns: string[];
  startLine: number;
  activeComponent: 'az1' | 'az2';
  isModalValid: boolean;
  columnMappings: Record<string, string>;
  uploadError: Record<'az1' | 'az2', string | null>;
}

/**
 * Props and emits for AZ preview modal component
 */
export interface AZPreviewModalProps {
  showModal: boolean;
  columns: string[];
  startLine: number;
  previewData: string[][];
  columnOptions: Array<{ value: string; label: string; required?: boolean }>;
  validateRequired?: boolean;
  source?: 'AZ' | 'AZ_RATE_DECK';
}

export interface AZPreviewModalEmits {
  'update:mappings': [mappings: Record<string, string>];
  'update:valid': [isValid: boolean];
  'update:start-line': [startLine: number];
  confirm: [mappings: Record<string, string>];
  cancel: [];
}

/**
 * Represents a single entry in the detailed A-Z comparison table
 * stored in the az_pricing_comparison_db.
 */
export interface AZDetailedComparisonEntry {
  dialCode: string; // The common dial code
  rate1: number; // Rate from the first file
  rate2: number; // Rate from the second file
  diff: number; // Difference (rate2 - rate1)
  destName1: string; // Destination name from the first file
  destName2: string; // Destination name from the second file
}

/**
 * Represents the information about a single file in the enhanced code report.
 */
export interface AZFileInfo {
  fileName: string;
  totalCodes: number; // Total rows/entries in the standardized file data
}

/**
 * Represents the code statistics comparing the file against the system (INT_COUNTRY_CODES).
 */
export interface AZCodeStats {
  systemCodeCount: number; // Total unique dial codes in INT_COUNTRY_CODES
  fileCodeCount: number; // Total unique dial codes in the uploaded file
}

/**
 * Represents the destination name statistics within the uploaded file.
 */
export interface AZDestinationStats {
  totalDestinations: number; // Total unique destination names in the file
  uniqueDestinationPercent: number; // (totalDestinations / totalCodes) * 100 - Or based on unique codes?
  // TBD: Clarify the denominator for uniqueDestinationPercent if needed.
}

/**
 * Represents a dial code found in the file for a specific country.
 */
export interface AZFileDialCode {
  dialCode: string;
  destName: string; // Destination name from the file for this dial code
}

/**
 * Represents the details of a specific destination breakout (e.g., "AFGHANISTAN CELLULAR AREEBA MTN")
 * found within a country in the uploaded A-Z file.
 */
export interface AZBreakoutDetail {
  breakoutName: string; // The specific destination name from the file
  dialCodes: string[]; // Unique dial codes associated ONLY with this breakoutName
}

/**
 * Represents the breakdown of dial codes and breakouts found in the file for a specific country,
 * compared against the system's known dial codes for that country.
 */
export interface AZCountryBreakdown {
  countryName: string;
  isoCode: string; // 2-letter ISO code
  totalSystemDialCodes: number; // Total unique dial codes for this country in INT_COUNTRY_CODES
  uniqueBreakoutCount: number; // Count of unique breakout names found in the file for this country
  breakouts: AZBreakoutDetail[]; // Detailed list of breakouts and their associated dial codes
}

/**
 * Represents the comprehensive single-file analysis report for an A-Z rate deck.
 */
export interface AZEnhancedCodeReport {
  fileInfo: AZFileInfo;
  codeStats: AZCodeStats;
  destinationStats: AZDestinationStats;
  countries: AZCountryBreakdown[];
}
