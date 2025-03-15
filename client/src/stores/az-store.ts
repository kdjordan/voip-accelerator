import { defineStore } from 'pinia';
import type { AzPricingReport, AzCodeReport, InvalidAzRow, AZStandardizedData } from '@/types/domains/az-types';
import type { DomainStore, ReportType } from '@/types';
import { storageConfig } from '@/config/storage-config';

export const useAzStore = defineStore('az', {
  state: () => ({
    filesUploaded: new Map<string, { fileName: string }>(),
    uploadingComponents: {} as Record<string, boolean>,
    showUploadComponents: true,
    reportsGenerated: false,
    singleFileReportReady: false,
    activeReportType: 'files' as ReportType,
    pricingReport: null as AzPricingReport | null,
    codeReport: null as AzCodeReport | null,
    singleFileReport: null as AzCodeReport | null,
    tempFiles: new Map<string, File>(),
    invalidRows: new Map<string, InvalidAzRow[]>(),
    inMemoryData: new Map<string, AZStandardizedData[]>(),
  }),

  getters: {
    isComponentDisabled: state => (componentName: string) => {
      return state.filesUploaded.has(componentName);
    },

    isComponentUploading: state => (componentName: string) => {
      return !!state.uploadingComponents[componentName];
    },

    isFull: state => state.filesUploaded.size === 2,

    getFileNames: state => Array.from(state.filesUploaded.values()).map(file => file.fileName),

    getActiveReportType: state => state.activeReportType,

    getPricingReport: state => state.pricingReport,

    getCodeReport: state => {
      // If we have a full comparison report, return that
      if (state.reportsGenerated && state.codeReport) {
        return state.codeReport;
      }
      
      // Otherwise, if we have a single file report, return that
      if (state.singleFileReportReady && state.singleFileReport) {
        return state.singleFileReport;
      }
      
      // If no reports are available, return null
      return null;
    },

    hasSingleFileReport: state => state.singleFileReportReady && state.singleFileReport !== null,

    getSingleFileReport: state => state.singleFileReport,

    getFileNameByComponent: state => (componentId: string) => {
      const file = state.filesUploaded.get(componentId);
      return file ? file.fileName : '';
    },

    getNumberOfFilesUploaded: state => state.filesUploaded.size,

    hasExistingFile: state => (fileName: string) => {
      return Array.from(state.filesUploaded.values()).some(f => f.fileName === fileName);
    },

    hasInvalidRows: state => (fileName: string) => {
      return state.invalidRows.has(fileName) && (state.invalidRows.get(fileName)?.length || 0) > 0;
    },

    getInvalidRowsForFile: state => (fileName: string) => {
      return state.invalidRows.get(fileName) || [];
    },

    getAllInvalidRows: state => {
      const result: Record<string, InvalidAzRow[]> = {};
      state.invalidRows.forEach((rows, fileName) => {
        result[fileName] = rows;
      });
      return result;
    },

    isUsingMemoryStorage: () => {
      return storageConfig.storageType === 'memory';
    },

    getInMemoryData: state => (tableName: string) => {
      return state.inMemoryData.get(tableName) || [];
    },

    getInMemoryTables: state => {
      const result: Record<string, number> = {};
      state.inMemoryData.forEach((data, tableName) => {
        result[tableName] = data.length;
      });
      return result;
    },

    shouldShowCodeReport: state => {
      return state.reportsGenerated || state.singleFileReportReady;
    },

    shouldShowPricingReport: state => {
      return state.reportsGenerated;
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
      this.singleFileReportReady = false;
      this.pricingReport = null;
      this.codeReport = null;
      this.singleFileReport = null;
      this.showUploadComponents = true;
      this.invalidRows.clear();
      this.inMemoryData.clear();
    },

    setReports(pricing: AzPricingReport, code: AzCodeReport) {
      this.pricingReport = pricing;
      this.codeReport = code;
      this.reportsGenerated = true;
      this.singleFileReportReady = false; // Clear single file report state when full reports are generated
      this.singleFileReport = null;
      this.showUploadComponents = false;
      this.activeReportType = 'code';
    },

    setSingleFileReport(report: AzCodeReport) {
      this.singleFileReport = report;
      this.singleFileReportReady = true;
      
      // If this is the first file, automatically switch to code report view
      if (this.filesUploaded.size === 1) {
        this.activeReportType = 'code';
      }
      // If this is the second file, we don't want to automatically switch tabs
      // so we don't set activeReportType here
    },

    setSingleFileReportReady(ready: boolean) {
      this.singleFileReportReady = ready;
    },

    setActiveReportType(type: ReportType) {
      this.activeReportType = type;
    },

    removeFile(fileName: string) {
      const tableName = fileName.toLowerCase().replace('.csv', '');
      
      this.filesUploaded.delete(fileName);

      this.invalidRows.delete(fileName);
      
      if (this.isUsingMemoryStorage) {
        this.inMemoryData.delete(tableName);
      }

      if (this.filesUploaded.size < 2) {
        this.reportsGenerated = false;
        this.pricingReport = null;
        this.codeReport = null;
        this.activeReportType = 'files';
      }

      if (this.filesUploaded.size === 0) {
        this.singleFileReportReady = false;
        this.singleFileReport = null;
      } else if (this.filesUploaded.size === 1) {
        // If we still have one file, regenerate the single file report
        const remainingComponentId = Array.from(this.filesUploaded.keys())[0];
        const remainingFileName = this.getFileNameByComponent(remainingComponentId);
        const tableName = remainingFileName.toLowerCase().replace('.csv', '');
        
        // Get the data for the remaining file
        const data = this.getInMemoryData(tableName);
        
        // Regenerate the single file report asynchronously
        setTimeout(() => {
          const azService = new (require('@/services/az.service').AZService)();
          azService.generateSingleFileReport(remainingFileName, data);
        }, 0);
      }

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
    }
  },
}) as unknown as () => DomainStore<AzPricingReport, AzCodeReport>;
