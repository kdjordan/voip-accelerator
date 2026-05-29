import { ref } from 'vue';
import { downloadTabularFile, type TabularFormat } from '@/utils/tabular-io';

/**
 * CSV Export Options for configuring the export behavior
 */
export interface CSVExportOptions {
  filename: string;
  timestamp?: boolean;
  additionalNameParts?: string[];
  quoteFields?: boolean;
  // NEW: Export context configuration for different export types
  exportContext?: 'rate-sheet' | 'comparison' | 'generic';
  customHeaders?: string[];
  fieldTransformations?: Record<string, (value: any) => string>;
  // Output format (ADR-0010). Defaults to 'csv'; XLSX content is identical.
  format?: TabularFormat;
}

/**
 * Build the final header + row arrays from CSVData (rows may be objects keyed
 * by header, or already-arrays), matching the shape both CSV and XLSX writers
 * consume. Centralized so every export path constructs identical content.
 */
function buildHeadersAndRows(
  headers: string[],
  rows: any[]
): { headers: string[]; rows: (string | number)[][] } {
  const rowArrays = rows.map((row) => {
    if (Array.isArray(row)) return row as (string | number)[];
    return headers.map((header) => row[header] ?? '');
  });
  return { headers, rows: rowArrays };
}

/**
 * CSV Data structure containing headers, rows, and optional metadata
 */
export interface CSVData {
  headers: string[];
  rows: any[];
  // NEW: Optional metadata for context-aware processing
  metadata?: {
    exportType?: string;
    sourceFiles?: string[];
    appliedFilters?: string[];
    adjustments?: any;
    sessionData?: any;
  };
}

export function useCSVExport() {
  const isExporting = ref(false);
  const exportError = ref<string | null>(null);

  function formatTimestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  // Returns a base filename WITHOUT extension; downloadTabularFile appends the
  // correct one (.csv / .xlsx) for the chosen format.
  function buildFilename(options: CSVExportOptions): string {
    const parts = [options.filename];

    if (options.additionalNameParts?.length) {
      parts.push(...options.additionalNameParts.filter(Boolean));
    }

    if (options.timestamp !== false) {
      parts.push(formatTimestamp());
    }

    return parts.join('-');
  }

  async function exportToCSV(data: CSVData, options: CSVExportOptions): Promise<void> {
    if (isExporting.value) return;

    isExporting.value = true;
    exportError.value = null;

    try {
      // Validate input data
      if (!data.rows.length) {
        throw new Error('No data to export');
      }

      // Route the write through the format-transparent tabular-IO layer.
      // XLSX content is identical to the CSV (same headers/rows).
      const { headers, rows } = buildHeadersAndRows(data.headers, data.rows);
      await downloadTabularFile(buildFilename(options), headers, rows, options.format ?? 'csv');
    } catch (error: any) {
      console.error('Error exporting CSV:', error);
      exportError.value = error.message || 'Failed to export CSV file';
      throw error;
    } finally {
      isExporting.value = false;
    }
  }

  /**
   * Context-aware CSV export function with enhanced processing
   * @param data - CSV data with optional metadata
   * @param options - Export options with context information
   * @returns Promise that resolves when export is complete
   */
  async function exportToCSVWithContext(data: CSVData, options: CSVExportOptions): Promise<void> {
    if (isExporting.value) return;

    const context = options.exportContext || 'generic';
    
    try {
      // Route to specialized handlers based on context
      switch (context) {
        case 'rate-sheet':
          await handleRateSheetExport(data, options);
          break;
        case 'comparison':
          await handleComparisonExport(data, options);
          break;
        case 'generic':
        default:
          // Fallback to original export function
          await exportToCSV(data, options);
          break;
      }
    } catch (error) {
      console.error('Error in context-aware CSV export:', error);
      throw error;
    }
  }

  return {
    isExporting,
    exportError,
    exportToCSV,
    exportToCSVWithContext,
  };
}

// Type guard for checking if a value is a valid number for CSV export
export function isValidNumber(value: any): value is number {
  return value !== null && value !== undefined && !isNaN(value);
}

// Utility function to format rate values consistently
export function formatRate(rate: number | null | undefined, decimals: number = 6): string {
  if (rate === null || rate === undefined || typeof rate !== 'number' || isNaN(rate)) {
    return 'N/A';
  }
  return rate.toFixed(decimals);
}

// Utility function to format percentage values consistently
export function formatPercentage(value: number | null | undefined, decimals: number = 6): string {
  if (!isValidNumber(value)) return 'N/A';
  return value.toFixed(decimals);
}

/**
 * Enhanced rate formatting function with context awareness
 * @param rate - The rate value to format
 * @param context - Export context for different formatting rules
 * @param decimals - Number of decimal places (default: 6)
 * @returns Formatted rate string
 */
export function formatRateForExport(
  rate: number | null | undefined, 
  context: 'rate-sheet' | 'comparison' | 'generic' = 'rate-sheet',
  decimals: number = 6
): string {
  if (!isValidNumber(rate)) return 'N/A';
  
  // Context-specific formatting rules can be added here
  switch (context) {
    case 'comparison':
      // For comparison exports, ensure consistent decimal places
      return rate.toFixed(decimals);
    case 'rate-sheet':
      // For rate sheet exports, use existing format
      return rate.toFixed(decimals);
    default:
      // Generic format
      return rate.toFixed(decimals);
  }
}

/**
 * Format percentage values for export with % suffix
 * @param percentage - The percentage value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string with % suffix
 */
export function formatPercentageForExport(
  percentage: number | null | undefined,
  decimals: number = 2
): string {
  if (!isValidNumber(percentage)) return 'N/A';
  return percentage.toFixed(decimals) + '%';
}

/**
 * Specialized export handler for rate sheet context
 * @param data - CSV data with rate sheet specific structure
 * @param options - Export options
 */
async function handleRateSheetExport(data: CSVData, options: CSVExportOptions): Promise<void> {
  const isExporting = ref(false);
  const exportError = ref<string | null>(null);
  
  if (isExporting.value) return;

  isExporting.value = true;
  exportError.value = null;

  try {
    // Validate input data
    if (!data.rows.length) {
      throw new Error('No rate sheet data to export');
    }

    // Apply field transformations if provided
    let processedRows = data.rows;
    if (options.fieldTransformations) {
      processedRows = data.rows.map(row => {
        const transformedRow = { ...row };
        Object.entries(options.fieldTransformations!).forEach(([field, transform]) => {
          if (transformedRow[field] !== undefined) {
            transformedRow[field] = transform(transformedRow[field]);
          }
        });
        return transformedRow;
      });
    }

    // Use custom headers if provided, otherwise use data headers
    const baseHeaders = options.customHeaders || data.headers;

    const { headers, rows } = buildHeadersAndRows(baseHeaders, processedRows);
    await downloadTabularFile(
      buildRateSheetFilename(options, data.metadata),
      headers,
      rows,
      options.format ?? 'csv'
    );
  } catch (error: any) {
    console.error('Error exporting rate sheet CSV:', error);
    exportError.value = error.message || 'Failed to export rate sheet CSV file';
    throw error;
  } finally {
    isExporting.value = false;
  }
}

/**
 * Specialized export handler for comparison context
 * @param data - CSV data with comparison specific structure
 * @param options - Export options
 */
async function handleComparisonExport(data: CSVData, options: CSVExportOptions): Promise<void> {
  const isExporting = ref(false);
  const exportError = ref<string | null>(null);
  
  if (isExporting.value) return;

  isExporting.value = true;
  exportError.value = null;

  try {
    // Validate input data
    if (!data.rows.length) {
      throw new Error('No comparison data to export');
    }

    // Apply field transformations if provided
    let processedRows = data.rows;
    if (options.fieldTransformations) {
      processedRows = data.rows.map(row => {
        const transformedRow = { ...row };
        Object.entries(options.fieldTransformations!).forEach(([field, transform]) => {
          if (transformedRow[field] !== undefined) {
            transformedRow[field] = transform(transformedRow[field]);
          }
        });
        return transformedRow;
      });
    }

    // Use custom headers if provided, otherwise use data headers
    const baseHeaders = options.customHeaders || data.headers;

    const { headers, rows } = buildHeadersAndRows(baseHeaders, processedRows);
    await downloadTabularFile(
      buildComparisonFilename(options, data.metadata),
      headers,
      rows,
      options.format ?? 'csv'
    );
  } catch (error: any) {
    console.error('Error exporting comparison CSV:', error);
    exportError.value = error.message || 'Failed to export comparison CSV file';
    throw error;
  } finally {
    isExporting.value = false;
  }
}

/**
 * Build filename for rate sheet exports with metadata
 */
function buildRateSheetFilename(options: CSVExportOptions, metadata?: CSVData['metadata']): string {
  const parts = [options.filename];

  // Add metadata-based parts
  if (metadata?.appliedFilters?.length) {
    parts.push(`filtered-${metadata.appliedFilters.length}`);
  }

  if (options.additionalNameParts?.length) {
    parts.push(...options.additionalNameParts.filter(Boolean));
  }

  if (options.timestamp !== false) {
    parts.push(new Date().toISOString().replace(/[:.]/g, '-'));
  }

  return parts.join('-');
}

/**
 * Build filename for comparison exports with metadata
 */
function buildComparisonFilename(options: CSVExportOptions, metadata?: CSVData['metadata']): string {
  const parts = [options.filename];

  // Add source files info if available
  if (metadata?.sourceFiles?.length) {
    parts.push(`${metadata.sourceFiles.length}-files`);
  }

  if (options.additionalNameParts?.length) {
    parts.push(...options.additionalNameParts.filter(Boolean));
  }

  if (options.timestamp !== false) {
    parts.push(new Date().toISOString().replace(/[:.]/g, '-'));
  }

  return parts.join('-');
}
