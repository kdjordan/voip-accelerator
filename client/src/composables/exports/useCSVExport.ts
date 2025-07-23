import { ref } from 'vue';
import Papa from 'papaparse';

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

  function buildFilename(options: CSVExportOptions): string {
    const parts = [options.filename];

    if (options.additionalNameParts?.length) {
      parts.push(...options.additionalNameParts.filter(Boolean));
    }

    if (options.timestamp !== false) {
      parts.push(formatTimestamp());
    }

    return `${parts.join('-')}.csv`;
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

      // Generate CSV content using Papa Parse
      const csv = Papa.unparse(
        data.rows,
        {
          quotes: options.quoteFields ?? true, // Default to true for safety
          header: false, // We handle headers manually in rows
        }
      );

      // Create and trigger download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute('download', buildFilename(options));
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
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
    const headers = options.customHeaders || data.headers;
    
    // Prepare data with headers
    const csvData = [headers, ...processedRows.map(row => {
      if (Array.isArray(row)) return row;
      return headers.map(header => row[header] || '');
    })];

    // Generate CSV content using Papa Parse
    const csv = Papa.unparse(csvData, {
      quotes: options.quoteFields ?? true,
      header: false,
    });

    // Create and trigger download with rate-sheet specific filename handling
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', buildRateSheetFilename(options, data.metadata));
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
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
    const headers = options.customHeaders || data.headers;
    
    // Prepare data with headers
    const csvData = [headers, ...processedRows.map(row => {
      if (Array.isArray(row)) return row;
      return headers.map(header => row[header] || '');
    })];

    // Generate CSV content using Papa Parse
    const csv = Papa.unparse(csvData, {
      quotes: options.quoteFields ?? true,
      header: false,
    });

    // Create and trigger download with comparison specific filename handling
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', buildComparisonFilename(options, data.metadata));
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
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

  return `${parts.join('-')}.csv`;
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

  return `${parts.join('-')}.csv`;
}
