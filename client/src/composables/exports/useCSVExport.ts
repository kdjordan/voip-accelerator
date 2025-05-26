import { ref } from 'vue';
import Papa from 'papaparse';

export interface CSVExportOptions {
  filename: string;
  timestamp?: boolean;
  additionalNameParts?: string[];
  quoteFields?: boolean;
}

export interface CSVData {
  headers: string[];
  rows: any[];
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
      if (!data.headers.length || !data.rows.length) {
        throw new Error('No data to export');
      }

      // Generate CSV content using Papa Parse
      const csv = Papa.unparse(
        {
          fields: data.headers,
          data: data.rows,
        },
        {
          quotes: options.quoteFields ?? true, // Default to true for safety
          header: true,
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

  return {
    isExporting,
    exportError,
    exportToCSV,
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
  return `$${rate.toFixed(decimals)}`;
}

// Utility function to format percentage values consistently
export function formatPercentage(value: number | null | undefined, decimals: number = 6): string {
  if (!isValidNumber(value)) return 'N/A';
  return `${value.toFixed(decimals)}%`;
}
