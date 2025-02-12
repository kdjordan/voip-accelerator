/**
 * Configuration for CSV preview generation
 */
export interface PreviewConfig {
  maxRows: number;
  startLine: number;
  columnMapping: Record<string, string>;
}

/**
 * Progress information during CSV processing
 */
export interface ProcessingProgress {
  totalRows: number;
  processedRows: number;
  percentage: number;
  stage: 'parsing' | 'validation' | 'transformation' | 'storage';
}

/**
 * Base interface for all CSV handlers
 */
export interface CSVHandler<T = any> {
  /**
   * Validates CSV headers against required columns
   */
  validateHeaders: (headers: string[]) => ValidationResult;

  /**
   * Validates a single row of CSV data
   */
  validateRow: (row: Record<string, string>, index: number) => ValidationResult;

  /**
   * Transforms a valid row into the target data format
   */
  transformRow: (row: Record<string, string>) => T;

  /**
   * Returns available column role options for the preview modal
   */
  getColumnRoleOptions: () => Array<{
    value: string;
    label: string;
    required: boolean;
  }>;

  /**
   * Validates the complete column mapping configuration
   */
  validateColumnMapping: (mapping: Record<string, string>) => ValidationResult;

  /**
   * Generates preview data from the CSV
   */
  generatePreview: (file: File, config: PreviewConfig) => Promise<{
    headers: string[];
    data: string[][];
  }>;

  /**
   * Process progress callback
   */
  onProgress?: (progress: ProcessingProgress) => void;
} 