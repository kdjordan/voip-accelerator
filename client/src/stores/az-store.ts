import { defineStore } from 'pinia';
import type {
  AzPricingReport,
  AzCodeReport,
  InvalidAzRow,
  AZStandardizedData,
} from '@/types/domains/az-types';
import type { DomainStore, ReportType } from '@/types';

export const useAzStore = defineStore('az', {
  state: () => ({
    filesUploaded: new Map<string, { fileName: string }>(),
    uploadingComponents: {} as Record<string, boolean>,
    showUploadComponents: true,
    reportsGenerated: false,
    activeReportType: 'files' as ReportType,
    pricingReport: null as AzPricingReport | null,
    codeReport: null as AzCodeReport | null,
    tempFiles: new Map<string, File>(),
    invalidRows: new Map<string, InvalidAzRow[]>(),
    inMemoryData: new Map<string, AZStandardizedData[]>(),
    fileStats: new Map<
      string,
      {
        totalCodes: number;
        totalDestinations: number;
        uniqueDestinationsPercentage: number;
      }
    >(),
  }),

  getters: {
    isComponentDisabled: (state) => (componentName: string) => {
      return state.filesUploaded.has(componentName);
    },

    isComponentUploading: (state) => (componentName: string) => {
      return !!state.uploadingComponents[componentName];
    },

    isFull: (state) => state.filesUploaded.size === 2,

    getFileNames: (state) => Array.from(state.filesUploaded.values()).map((file) => file.fileName),

    getActiveReportType: (state) => state.activeReportType,

    getPricingReport: (state) => state.pricingReport,

    getCodeReport: (state) => {
      // If we have a full comparison report, return that
      if (state.reportsGenerated && state.codeReport) {
        return state.codeReport;
      }

      return null;
    },

    getFileNameByComponent: (state) => (componentId: string) => {
      const file = state.filesUploaded.get(componentId);
      return file ? file.fileName : '';
    },

    getNumberOfFilesUploaded: (state) => state.filesUploaded.size,

    hasExistingFile: (state) => (fileName: string) => {
      return Array.from(state.filesUploaded.values()).some((f) => f.fileName === fileName);
    },

    hasInvalidRows: (state) => (fileName: string) => {
      return state.invalidRows.has(fileName) && (state.invalidRows.get(fileName)?.length || 0) > 0;
    },

    getInvalidRowsForFile: (state) => (fileName: string) => {
      return state.invalidRows.get(fileName) || [];
    },

    getAllInvalidRows: (state) => {
      const result: Record<string, InvalidAzRow[]> = {};
      state.invalidRows.forEach((rows, fileName) => {
        result[fileName] = rows;
      });
      return result;
    },

    isUsingMemoryStorage: () => {
      return true; // Always use memory storage since config was removed
    },

    getInMemoryData: (state) => (tableName: string) => {
      return state.inMemoryData.get(tableName) || [];
    },

    getInMemoryTables: (state) => {
      const result: Record<string, number> = {};
      state.inMemoryData.forEach((data, tableName) => {
        result[tableName] = data.length;
      });
      return result;
    },

    shouldShowPricingReport: (state) => {
      return state.reportsGenerated;
    },

    getFileStats: (state) => (componentId: string) => {
      return (
        state.fileStats.get(componentId) || {
          totalCodes: 0,
          totalDestinations: 0,
          uniqueDestinationsPercentage: 0,
        }
      );
    },

    hasSingleFileReport: (state) => {
      return state.fileStats.size > 0 && state.fileStats.size < 2;
    },
  },

  actions: {
    addFileUploaded(componentName: string, fileName: string) {
      if (componentName.startsWith('az')) {
        this.filesUploaded.set(componentName, { fileName });
      }
    },

    resetFiles() {
      this.filesUploaded.clear();
      this.reportsGenerated = false;
      // this.singleFileReportReady = false;
      this.pricingReport = null;
      this.codeReport = null;
      // this.singleFileReport = null;
      this.showUploadComponents = true;
      this.invalidRows.clear();
      this.inMemoryData.clear();
      this.fileStats.clear();
    },

    setReports(pricing: AzPricingReport, code: AzCodeReport) {
      this.pricingReport = pricing;
      this.codeReport = code;
      this.reportsGenerated = true;
      // Don't clear single file reports or hide upload components
      this.activeReportType = 'files'; // Default to files view when reports are generated
    },

    setActiveReportType(type: ReportType) {
      this.activeReportType = type;
    },

    removeFile(fileName: string) {
      const tableName = fileName.toLowerCase().replace('.csv', '');

      // Find the component ID associated with this file
      let componentId = '';
      for (const [key, value] of this.filesUploaded.entries()) {
        if (value.fileName === fileName) {
          componentId = key;
          break;
        }
      }

      if (componentId) {
        // Remove the file from filesUploaded
        this.filesUploaded.delete(componentId);

        // Clear file stats for this component
        this.clearFileStats(componentId);

        console.log(`[AzStore] Removed file ${fileName} from component ${componentId}`);
      } else {
        console.warn(`[AzStore] Could not find component ID for file ${fileName}`);
      }

      // Clear any invalid rows for this file
      this.invalidRows.delete(fileName);

      // Clear in-memory data if using memory storage
      if (this.isUsingMemoryStorage) {
        this.inMemoryData.delete(tableName);
        console.log(`[AzStore] Cleared in-memory data for ${tableName}`);
      }

      // Reset reports if we now have fewer than 2 files
      if (this.filesUploaded.size < 2) {
        this.reportsGenerated = false;
        this.pricingReport = null;
        this.codeReport = null;
        this.activeReportType = 'files';
      }

      // Keep upload components visible
      this.showUploadComponents = true;
    },

    checkFileNameAvailable(fileName: string): boolean {
      return this.filesUploaded.has(fileName);
    },

    setComponentFileIsUploading(componentName: string): void {
      this.setComponentUploading(componentName, true);
    },

    getStoreNameByComponent(componentName: string): string {
      return `${componentName}`;
    },

    setComponentUploading(componentName: string, isUploading: boolean) {
      this.uploadingComponents[componentName] = isUploading;
    },

    setTempFile(componentId: string, file: File) {
      this.tempFiles.set(componentId, file);
    },

    getTempFile(componentId: string) {
      return this.tempFiles.get(componentId);
    },

    clearTempFile(componentId: string) {
      this.tempFiles.delete(componentId);
    },

    addInvalidRow(fileName: string, row: InvalidAzRow) {
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

    storeInMemoryData(tableName: string, data: AZStandardizedData[]) {
      this.inMemoryData.set(tableName, data);
    },

    getInMemoryDataCount(tableName: string): number {
      return this.inMemoryData.get(tableName)?.length || 0;
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
  },
}) as unknown as () => DomainStore<AzPricingReport, AzCodeReport, InvalidAzRow>;
