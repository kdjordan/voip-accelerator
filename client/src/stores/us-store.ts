import { defineStore } from 'pinia';
import type {
  USPricingReport,
  USCodeReport,
  InvalidUsRow,
  USStandardizedData,
  USEnhancedCodeReport,
} from '../types/domains/us-types';
import type { ReportType } from '@/types';
import type { DomainStore } from '@/types';

export const useUsStore = defineStore('usStore', {
  state: () => ({
    filesUploaded: new Map<string, { fileName: string }>(),
    showUploadComponents: true,
    reportsGenerated: false,
    activeReportType: 'files' as ReportType,
    pricingReport: null as USPricingReport | null,
    codeReport: null as USCodeReport | null,
    // Store enhanced code reports by filename
    enhancedCodeReports: new Map<string, USEnhancedCodeReport>(),
    uploadingComponents: {} as Record<string, boolean>,
    tempFiles: new Map<string, File>(),
    invalidRows: new Map<string, InvalidUsRow[]>(),
    // Add in-memory storage
    inMemoryData: new Map<string, USStandardizedData[]>(),
    fileStats: new Map<
      string,
      {
        totalCodes: number;
        totalDestinations: number;
        uniqueDestinationsPercentage: number;
        usNPACoveragePercentage: number;
        avgInterRate: number;
        avgIntraRate: number;
        avgIndetermRate: number;
      }
    >(),
  }),

  getters: {
    isComponentDisabled:
      (state) =>
      (componentName: string): boolean =>
        state.filesUploaded.has(componentName),

    isFull: (state): boolean => state.filesUploaded.size === 2,

    getFileNames: (state): string[] =>
      Array.from(state.filesUploaded.values()).map((file) => file.fileName),

    getActiveReportType: (state): ReportType => state.activeReportType,

    getPricingReport: (state): USPricingReport | null => state.pricingReport,

    getCodeReport: (state): USCodeReport | null => state.codeReport,

    getEnhancedCodeReport: (state): USEnhancedCodeReport | null => {
      // If we have reports in the Map, return the first one
      if (state.enhancedCodeReports.size > 0) {
        // Get the iterator for the values and extract the first value
        const iterator = state.enhancedCodeReports.values();
        const firstValue = iterator.next();

        // Make sure we have a defined value before returning
        if (!firstValue.done && firstValue.value) {
          return firstValue.value;
        }
      }
      return null;
    },

    getNumberOfFilesUploaded: (state) => state.filesUploaded.size,

    isComponentUploading:
      (state) =>
      (componentName: string): boolean =>
        !!state.uploadingComponents[componentName],

    getFileNameByComponent:
      (state) =>
      (componentName: string): string => {
        const file = state.filesUploaded.get(componentName);
        return file ? file.fileName : '';
      },

    getInvalidRows:
      (state) =>
      (fileName: string): InvalidUsRow[] => {
        return state.invalidRows.get(fileName) || [];
      },

    hasInvalidRows:
      (state) =>
      (fileName: string): boolean => {
        return (
          state.invalidRows.has(fileName) && (state.invalidRows.get(fileName)?.length || 0) > 0
        );
      },

    hasExistingFile:
      (state) =>
      (fileName: string): boolean => {
        return Array.from(state.filesUploaded.values()).some((f) => f.fileName === fileName);
      },

    isUsingMemoryStorage: () => {
      return true; // Always use memory storage since config was removed
    },

    getFileStats: (state) => (componentId: string) => {
      return (
        state.fileStats.get(componentId) || {
          totalCodes: 0,
          totalDestinations: 0,
          uniqueDestinationsPercentage: 0,
          usNPACoveragePercentage: 0,
          avgInterRate: 0,
          avgIntraRate: 0,
          avgIndetermRate: 0,
        }
      );
    },

    // In-memory storage getters
    getInMemoryData: (state) => (tableName: string) => {
      return state.inMemoryData.get(tableName) || [];
    },

    getInMemoryDataCount: (state) => (tableName: string) => {
      return state.inMemoryData.get(tableName)?.length || 0;
    },

    getInMemoryTables: (state) => {
      const result: Record<string, number> = {};
      state.inMemoryData.forEach((data, tableName) => {
        result[tableName] = data.length;
      });
      return result;
    },

    hasSingleFileReport: (state) => {
      return state.fileStats.size > 0 && state.fileStats.size < 2;
    },

    // Add this getter to retrieve file data by component ID
    getFileDataByComponent: (state) => (componentId: string) => {
      const fileName = state.filesUploaded.get(componentId)?.fileName;
      if (!fileName) return [];

      const tableName = fileName.toLowerCase().replace('.csv', '');
      return state.inMemoryData.get(tableName) || [];
    },

    // Add a getter to retrieve an enhanced report by filename
    getEnhancedReportByFile:
      (state) =>
      (fileName: string): USEnhancedCodeReport | null => {
        return state.enhancedCodeReports.get(fileName) || null;
      },

    // Add a getter to check if we have any enhanced reports
    hasEnhancedReports: (state): boolean => {
      return state.enhancedCodeReports.size > 0;
    },

    // Get all enhanced reports
    getAllEnhancedReports: (state): USEnhancedCodeReport[] => {
      return Array.from(state.enhancedCodeReports.values());
    },
  },

  actions: {
    setActiveReportType(reportType: ReportType) {
      this.activeReportType = reportType;
    },

    addFileUploaded(componentName: string, fileName: string) {
      this.filesUploaded.set(componentName, { fileName });
    },

    resetFiles() {
      this.filesUploaded.clear();
      this.reportsGenerated = false;
      this.pricingReport = null;
      this.codeReport = null;
      this.enhancedCodeReports.clear();
      this.showUploadComponents = true;
      this.invalidRows.clear();
      this.inMemoryData.clear();
      this.fileStats.clear();
    },

    setReports(pricing: USPricingReport, code: USCodeReport) {
      this.pricingReport = pricing;
      this.codeReport = code;
      this.reportsGenerated = true;
      this.showUploadComponents = false;
    },

    setEnhancedCodeReport(report: USEnhancedCodeReport) {
      // Store in the map by filename
      if (report.file1 && report.file1.fileName) {
        console.log(`[US Store] Setting enhanced report for file: ${report.file1.fileName}`);

        // Test the Map functionality with a simple value
        const testKey = `test-${Date.now()}`;
        console.log(`[US Store] Testing Map with simple value - key: ${testKey}`);
        this.enhancedCodeReports.set(testKey, report);
        const testResult = this.enhancedCodeReports.get(testKey);
        console.log(`[US Store] Test Map result:`, {
          success: !!testResult,
          size: this.enhancedCodeReports.size,
          keys: Array.from(this.enhancedCodeReports.keys()),
        });

        // Now try with the actual file name
        this.enhancedCodeReports.set(report.file1.fileName, report);
        console.log(`[US Store] Total enhanced reports: ${this.enhancedCodeReports.size}`);
        console.log(`[US Store] Report keys: ${Array.from(this.enhancedCodeReports.keys())}`);

        // Verify we can access the stored report
        const storedReport = this.enhancedCodeReports.get(report.file1.fileName);
        console.log(`[US Store] Verification - retrieved: ${!!storedReport}`);
      } else {
        console.error('[US Store] Cannot save report - missing filename', report);
      }
    },

    setReportsGenerated(value: boolean) {
      this.reportsGenerated = value;
    },

    removeFile(componentName: string) {
      const fileName = this.getFileNameByComponent(componentName);
      if (fileName) {
        // Get the tableName from the filename
        const tableName = fileName.toLowerCase().replace('.csv', '');

        // Remove from in-memory data if using memory storage
        if (this.isUsingMemoryStorage) {
          this.inMemoryData.delete(tableName);
        }

        // Remove from enhanced reports
        console.log(`[US Store] Removing enhanced report for: ${fileName}`);
        this.enhancedCodeReports.delete(fileName);
        console.log(`[US Store] Reports after removal: ${this.enhancedCodeReports.size}`);
      }

      this.filesUploaded.delete(componentName);

      // Clear file stats for this component
      this.clearFileStats(componentName);

      // Clear any invalid rows for this file
      if (fileName) {
        this.invalidRows.delete(fileName);
      }

      // Reset reports if no files left
      if (this.filesUploaded.size === 0) {
        this.reportsGenerated = false;
        this.pricingReport = null;
        this.codeReport = null;
        this.enhancedCodeReports.clear();
        this.showUploadComponents = true;
        this.activeReportType = 'files';
      }
    },

    setComponentUploading(componentName: string, isUploading: boolean) {
      this.uploadingComponents[componentName] = isUploading;
    },

    // Temp file handling for preview
    setTempFile(componentName: string, file: File) {
      this.tempFiles.set(componentName, file);
    },

    getTempFile(componentName: string): File | undefined {
      return this.tempFiles.get(componentName);
    },

    clearTempFile(componentName: string) {
      this.tempFiles.delete(componentName);
    },

    // Invalid rows handling
    addInvalidRow(fileName: string, row: InvalidUsRow) {
      if (!this.invalidRows.has(fileName)) {
        this.invalidRows.set(fileName, []);
      }
      this.invalidRows.get(fileName)?.push(row);
    },

    clearInvalidRowsForFile(fileName: string) {
      this.invalidRows.delete(fileName);
    },

    clearAllInvalidRows() {
      this.invalidRows.clear();
    },

    // In-memory storage actions
    storeInMemoryData(tableName: string, data: USStandardizedData[]) {
      this.inMemoryData.set(tableName, data);
    },

    removeInMemoryData(tableName: string) {
      this.inMemoryData.delete(tableName);
    },

    clearAllInMemoryData() {
      this.inMemoryData.clear();
    },

    setFileStats(
      componentId: string,
      stats: {
        totalCodes: number;
        totalDestinations: number;
        uniqueDestinationsPercentage: number;
        usNPACoveragePercentage: number;
        avgInterRate: number;
        avgIntraRate: number;
        avgIndetermRate: number;
      }
    ) {
      this.fileStats.set(componentId, stats);
    },

    clearFileStats(componentId: string) {
      this.fileStats.delete(componentId);
    },

    clearAllFileStats() {
      this.fileStats.clear();
    },

    // Add a clear method for enhanced reports
    clearEnhancedCodeReports() {
      this.enhancedCodeReports.clear();
    },

    // Add a debug test function that can be called from anywhere
    testEnhancedReportStorage() {
      console.log('[US Store] Running enhanced report storage test');

      // Create a simple test report
      const testReport = {
        file1: {
          fileName: `test-file-${Date.now()}.csv`,
          totalCodes: 100,
          countries: [
            {
              countryCode: 'US',
              countryName: 'United States',
              npaCoverage: 50,
              totalNPAs: 200,
              npas: ['123', '456'],
            },
          ],
        },
      } as USEnhancedCodeReport;

      // Store it and check
      this.enhancedCodeReports.set(testReport.file1.fileName, testReport);
      console.log('[US Store] Test report storage results:', {
        size: this.enhancedCodeReports.size,
        keys: Array.from(this.enhancedCodeReports.keys()),
        hasReport: this.hasEnhancedReports,
        retrieval: !!this.getEnhancedReportByFile(testReport.file1.fileName),
      });

      // Also try the function
      this.setEnhancedCodeReport(testReport);
    },
  },
}) as unknown as () => DomainStore<USPricingReport, USCodeReport, InvalidUsRow>;
