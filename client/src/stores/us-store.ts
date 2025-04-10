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
    isCodeReportReady: false,
    isPricingReportReady: false,
    isPricingReportProcessing: false,
    activeReportType: 'files' as ReportType,
    pricingReport: null as USPricingReport | null,
    codeReport: null as USCodeReport | null,
    enhancedCodeReports: new Map<string, USEnhancedCodeReport>(),
    uploadingComponents: {} as Record<string, boolean>,
    tempFiles: new Map<string, File>(),
    invalidRows: new Map<string, InvalidUsRow[]>(),
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

    areReportsReady: (state): boolean => state.isCodeReportReady && state.isPricingReportReady,

    getEnhancedCodeReport: (state): USEnhancedCodeReport | null => {
      if (state.enhancedCodeReports.size > 0) {
        const iterator = state.enhancedCodeReports.values();
        const firstValue = iterator.next();

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
      return true;
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

    getFileDataByComponent: (state) => (componentId: string) => {
      const fileName = state.filesUploaded.get(componentId)?.fileName;
      if (!fileName) return [];

      const tableName = fileName.toLowerCase().replace('.csv', '');
      return state.inMemoryData.get(tableName) || [];
    },

    getEnhancedReportByFile:
      (state) =>
      (fileName: string): USEnhancedCodeReport | null => {
        return state.enhancedCodeReports.get(fileName) || null;
      },

    hasEnhancedReports: (state): boolean => {
      return state.enhancedCodeReports.size > 0;
    },

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
      this.isCodeReportReady = false;
      this.isPricingReportReady = false;
      this.isPricingReportProcessing = false;
      this.pricingReport = null;
      this.codeReport = null;
      this.enhancedCodeReports.clear();
      this.showUploadComponents = true;
      this.invalidRows.clear();
      this.inMemoryData.clear();
      this.fileStats.clear();
      this.activeReportType = 'files';
    },

    setCodeReport(code: USCodeReport) {
      console.log('[US Store] Setting Code Report:', code);
      this.codeReport = code;
      this.isCodeReportReady = true;
      if (this.filesUploaded.size > 0) {
        this.showUploadComponents = false;
      }
    },

    setPricingReport(pricing: USPricingReport) {
      console.log('[US Store] Setting Pricing Report:', pricing);
      this.pricingReport = pricing;
      this.isPricingReportReady = true;
      if (this.filesUploaded.size > 0) {
        this.showUploadComponents = false;
      }
    },

    setPricingReportProcessing(processing: boolean) {
      this.isPricingReportProcessing = processing;
    },

    setEnhancedCodeReport(report: USEnhancedCodeReport) {
      if (report.file1?.fileName) {
        console.log(`[US Store] Setting enhanced report for file: ${report.file1.fileName}`);
        this.enhancedCodeReports.set(report.file1.fileName, report);
        console.log(`[US Store] Enhanced reports count: ${this.enhancedCodeReports.size}`);
      } else {
        console.error('[US Store] Cannot save report - missing filename', report);
      }
    },

    removeFile(componentName: string) {
      const fileName = this.getFileNameByComponent(componentName);
      if (fileName) {
        const tableName = fileName.toLowerCase().replace('.csv', '');

        if (this.isUsingMemoryStorage) {
          this.inMemoryData.delete(tableName);
        }

        console.log(`[US Store] Removing enhanced report for: ${fileName}`);
        this.enhancedCodeReports.delete(fileName);
        console.log(`[US Store] Reports after removal: ${this.enhancedCodeReports.size}`);
      }

      this.filesUploaded.delete(componentName);

      this.clearFileStats(componentName);

      if (fileName) {
        this.invalidRows.delete(fileName);
      }

      if (this.filesUploaded.size === 0) {
        this.resetFiles();
      } else if (this.filesUploaded.size === 1) {
        this.pricingReport = null;
        this.isPricingReportReady = false;
        this.isPricingReportProcessing = false;
        this.codeReport = null;
        this.isCodeReportReady = false;
        this.activeReportType = 'files';
      }
    },

    setComponentUploading(componentName: string, isUploading: boolean) {
      this.uploadingComponents[componentName] = isUploading;
    },

    setTempFile(componentName: string, file: File) {
      this.tempFiles.set(componentName, file);
    },

    getTempFile(componentName: string): File | undefined {
      return this.tempFiles.get(componentName);
    },

    clearTempFile(componentName: string) {
      this.tempFiles.delete(componentName);
    },

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

    clearEnhancedCodeReports() {
      this.enhancedCodeReports.clear();
    },
  },
}) as unknown as () => DomainStore<USPricingReport, USCodeReport, InvalidUsRow>;
