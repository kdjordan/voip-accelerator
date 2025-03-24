import type {
  AZStandardizedData,
  AzPricingReport,
  AzCodeReport,
  InvalidAzRow,
} from '@/types/domains/az-types';
import type {
  USStandardizedData,
  USPricingReport,
  USCodeReport,
  InvalidUsRow,
} from '@/types/domains/us-types';

// Define a FileStats interface that can be used for both AZ and US
export interface FileStats {
  totalCodes: number;
  totalDestinations: number;
  uniqueDestinationsPercentage: number;
  // Include US-specific fields as optional
  usNPACoveragePercentage?: number;
  avgInterRate?: number;
  avgIntraRate?: number;
  avgIndetermRate?: number;
}

// Add this type definition
export type DomainStoreType =
  | DomainStore<AzPricingReport, AzCodeReport, InvalidAzRow>
  | DomainStore<USPricingReport, USCodeReport, InvalidUsRow>;

export interface DomainStore<P, C, I> {
  // State properties
  filesUploaded: Map<string, { fileName: string }>;
  uploadingComponents: Record<string, boolean>;
  showUploadComponents: boolean;
  reportsGenerated: boolean;
  activeReportType: ReportType;
  pricingReport: P | null;
  codeReport: C | null;
  tempFiles: Map<string, File>;
  invalidRows: Map<string, I[]>;
  fileStats: Map<string, FileStats>;

  // Getters
  isComponentDisabled: (componentName: string) => boolean;
  isComponentUploading: (componentName: string) => boolean;
  isFull: boolean;
  getFileNames: string[];
  getActiveReportType: ReportType;
  getPricingReport: P | null;
  getCodeReport: C | null;
  getFileNameByComponent: (componentId: string) => string;
  getNumberOfFilesUploaded: number;
  hasExistingFile: (fileName: string) => boolean;
  hasInvalidRows: (fileName: string) => boolean;
  getInvalidRowsForFile: (fileName: string) => I[];
  getAllInvalidRows: Record<string, I[]>;
  hasSingleFileReport: boolean;
  getFileStats: (componentId: string) => FileStats;

  // Actions
  addFileUploaded: (componentName: string, fileName: string) => void;
  resetFiles: () => void;
  setReports: (pricing: P, code: C) => void;
  setActiveReportType: (type: ReportType) => void;
  removeFile: (fileName: string) => void;
  checkFileNameAvailable: (fileName: string) => boolean;
  setComponentFileIsUploading: (componentName: string) => void;
  getStoreNameByComponent: (componentName: string) => string;
  setComponentUploading: (componentName: string, isUploading: boolean) => void;

  // File management
  setTempFile: (componentId: string, file: File) => void;
  getTempFile: (componentId: string) => File | undefined;
  clearTempFile: (componentId: string) => void;

  // Invalid row handling
  clearInvalidRowsForFile: (fileName: string) => void;
  addInvalidRow: (fileName: string, row: I) => void;
  clearAllInvalidRows: () => void;

  // In-memory storage related methods
  storeInMemoryData: (tableName: string, data: any[]) => void;
  getInMemoryData: (tableName: string) => any[];
  getInMemoryDataCount: (tableName: string) => number;
  removeInMemoryData: (tableName: string) => void;
  clearAllInMemoryData: () => void;
  getInMemoryTables: Record<string, number>;

  // File stats methods
  setFileStats: (componentId: string, stats: FileStats) => void;
  clearFileStats: (componentId: string) => void;
  clearAllFileStats: () => void;
}

// Union type of all possible standardized data types
export type StandardizedData = AZStandardizedData | USStandardizedData;

// Replace enum with const map for better type safety
export const DBName = {
  AZ: 'az_rate_deck_db',
  US: 'us_rate_deck_db',
  LERG: 'lerg_db',
  RATE_SHEET: 'rate_sheet_db',
} as const;

export type DBNameType = (typeof DBName)[keyof typeof DBName];

// Add shared report types
export const ReportTypes = {
  FILES: 'files',
  CODE: 'code',
  PRICING: 'pricing',
} as const;

export type ReportType = (typeof ReportTypes)[keyof typeof ReportTypes];

// Define supported DB types for schemas
export type SchemaDBType =
  | typeof DBName.AZ
  | typeof DBName.US
  | typeof DBName.RATE_SHEET
  | typeof DBName.LERG;

export const DBSchemas = {
  [DBName.AZ]: '++id, destName, dialCode, rate',
  [DBName.US]: '++id, npa, nxx, npanxx, interRate, intraRate, indetermRate, *npanxxIdx',
  [DBName.RATE_SHEET]: '++id, destinationName, code, rate, effectiveDate, minDuration, increments',
  [DBName.LERG]: 'npa, *state, *country',
} as const;

// Type guard to check if a DBNameType is supported for schemas
export function isSchemaSupported(dbName: DBNameType): dbName is SchemaDBType {
  return (
    dbName === DBName.AZ ||
    dbName === DBName.US ||
    dbName === DBName.RATE_SHEET ||
    dbName === DBName.LERG
  );
}
