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
import type { Component } from 'vue';

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

// Component identifiers for file upload components
export type ComponentId = 'az1' | 'az2' | 'us1' | 'us2';

// Shared notification types used across components
export interface NotificationAction {
  label: string;
  handler: () => void;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Used for feature card layout in the home page
 */
export interface FeatureCard {
  id: number;
  icon: Component;
  title: string;
  description: string;
  rotate: string;
  yOffset: string;
}

/**
 * Preview state for file uploads
 */
export interface PreviewState {
  data: string[][];
  columns: string[];
  startLine: number;
  indeterminateRateDefinition?: string;
}

// After the PreviewState interface definition
/**
 * Generic PreviewModal props and emits that can be extended by domain-specific ones
 */
export interface BasePreviewModalProps {
  showModal: boolean;
  columns: string[];
  startLine: number;
  previewData: string[][];
  columnOptions: Array<{ value: string; label: string; required?: boolean }>;
  validateRequired?: boolean;
}

export interface BasePreviewModalEmits {
  'update:mappings': [mappings: Record<string, string>];
  'update:valid': [isValid: boolean];
  'update:start-line': [startLine: number];
  'update:indeterminate-definition': [definition: string];
  confirm: [mappings: Record<string, string>, ...any[]];
  cancel: [];
}

// Button Component
export type ButtonVariant = 'primary' | 'secondary' | 'secondary-outline' | 'destructive';
export type ButtonSize = 'small' | 'standard';
export type ButtonType = 'button' | 'submit' | 'reset';

// New: Define props for the BaseButton component
export interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: ButtonType;
  disabled?: boolean;
  icon?: Component;
  loading?: boolean;
}

// New: Define props for the BaseBadge component
export interface BaseBadgeProps {
  variant?:
    | 'primary'
    | 'info'
    | 'success'
    | 'warning'
    | 'destructive'
    | 'neutral'
    | 'violet'
    | 'accent'; // Added accent for highlighting
  size?: 'standard' | 'small';
  uppercase?: boolean;
}

// Generic file upload state type
export interface BaseFileUploadState {
  isGeneratingReports: boolean;
  showPreviewModal: boolean;
  previewData: string[][];
  columns: string[];
  startLine: number;
  activeComponent: ComponentId;
  isModalValid: boolean;
  columnMappings: Record<string, string>;
  uploadError: Record<ComponentId, string | null>;
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
  enhancedCodeReport: any | null;
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
  getEnhancedCodeReport: any | null;
  getFileNameByComponent: (componentId: string) => string;
  getFileDataByComponent: (componentId: string) => any[];
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
  setEnhancedCodeReport: (report: any) => void;

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
  AZ_RATE_SHEET: 'az_rate_sheet_db',
  US_RATE_SHEET: 'us_rate_sheet_db',
  US_PRICING_COMPARISON: 'us_pricing_comparison_db',
  AZ_PRICING_COMPARISON: 'az_pricing_comparison_db',
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
  | typeof DBName.LERG
  | typeof DBName.AZ_RATE_SHEET
  | typeof DBName.US_RATE_SHEET
  | typeof DBName.US_PRICING_COMPARISON
  | typeof DBName.AZ_PRICING_COMPARISON;

export const DBSchemas = {
  [DBName.AZ]: '++id, destName, dialCode, rate',
  [DBName.US]: '++id, npa, nxx, npanxx, interRate, intraRate, indetermRate, *npanxxIdx, sourceFile',
  // Schema for AZ Rate Sheet (formerly RATE_SHEET)
  [DBName.AZ_RATE_SHEET]:
    'entries: ++id, destinationName, code, rate, effectiveDate, minDuration, increments',
  // Schema for US Rate Sheet (new)
  [DBName.US_RATE_SHEET]:
    'entries: ++id, npa, nxx, npanxx, interRate, intraRate, indetermRate, stateCode',
  [DBName.LERG]: 'npa, *state, *country',
  [DBName.US_PRICING_COMPARISON]: `
    comparison_results: ++id, &npanxx,
    npa,
    nxx,
    stateCode,
    countryCode,
    diff_inter_pct,
    diff_intra_pct,
    diff_indeterm_pct,
    file1_inter,
    file1_intra,
    file1_indeterm,
    file2_inter,
    file2_intra,
    file2_indeterm,
    cheaper_file
  `,
  // Add schema for AZ Pricing Comparison DB
  [DBName.AZ_PRICING_COMPARISON]: `
    az_comparison_results: ++id, &dialCode, matchStatus,
    rate1,
    rate2,
    diff,
    destName1,
    destName2,
    cheaperFile,
    diffPercent
  `,
} as const;

// Define schemas for dynamically created tables (e.g., filename-based)
export const DynamicTableSchemas = {
  [DBName.AZ]: '++id, destName, dialCode, rate',
  [DBName.US]: '++id, npa, nxx, npanxx, interRate, intraRate, indetermRate, *npanxxIdx, sourceFile',
} as const;

// Type guard to check if a DBNameType is supported for schemas
export function isSchemaSupported(dbName: DBNameType): dbName is SchemaDBType {
  return (
    dbName === DBName.AZ ||
    dbName === DBName.US ||
    dbName === DBName.AZ_RATE_SHEET ||
    dbName === DBName.US_RATE_SHEET ||
    dbName === DBName.LERG ||
    dbName === DBName.US_PRICING_COMPARISON ||
    dbName === DBName.AZ_PRICING_COMPARISON
  );
}
