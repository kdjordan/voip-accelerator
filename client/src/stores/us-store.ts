import { defineStore } from 'pinia';
import type { USPricingReport, USCodeReport, InvalidUsRow, USStandardizedData } from '../types/domains/us-types';
import type { ReportType } from '@/types';
import type { DomainStore } from '@/types';
import { storageConfig } from '@/config/storage-config';

export const useUsStore = defineStore('usStore', {
  state: () => ({
    filesUploaded: new Map<string, { fileName: string }>(),
    showUploadComponents: true,
    reportsGenerated: false,
    activeReportType: 'files' as ReportType,
    pricingReport: null as USPricingReport | null,
    codeReport: null as USCodeReport | null,
    uploadingComponents: {} as Record<string, boolean>,
    tempFiles: new Map<string, File>(),
    invalidRows: new Map<string, InvalidUsRow[]>(),
    // Add in-memory storage
    inMemoryData: new Map<string, USStandardizedData[]>(),
    fileStats: new Map<string, {
      totalCodes: number;
      totalDestinations: number;
      uniqueDestinationsPercentage: number;
    }>(),
  }),

  getters: {
    isComponentDisabled:
      state =>
      (componentName: string): boolean =>
        state.filesUploaded.has(componentName),

    isFull: (state): boolean => state.filesUploaded.size === 2,

    getFileNames: (state): string[] => Array.from(state.filesUploaded.values()).map(file => file.fileName),

    getActiveReportType: (state): ReportType => state.activeReportType,

    getPricingReport: (state): USPricingReport | null => state.pricingReport,

    getCodeReport: (state): USCodeReport | null => state.codeReport,

    getNumberOfFilesUploaded: state => state.filesUploaded.size,

    isComponentUploading:
      state =>
      (componentName: string): boolean =>
        !!state.uploadingComponents[componentName],
        
    getFileNameByComponent:
      state =>
      (componentName: string): string => {
        const file = state.filesUploaded.get(componentName);
        return file ? file.fileName : '';
      },
      
    getInvalidRows: state => (fileName: string): InvalidUsRow[] => {
      return state.invalidRows.get(fileName) || [];
    },
    
    hasInvalidRows: state => (fileName: string): boolean => {
      return state.invalidRows.has(fileName) && (state.invalidRows.get(fileName)?.length || 0) > 0;
    },
    
    hasExistingFile: state => (fileName: string): boolean => {
      return Array.from(state.filesUploaded.values()).some(f => f.fileName === fileName);
    },
    
    isUsingMemoryStorage: () => {
      return storageConfig.storageType === 'memory';
    },

    getFileStats: state => (componentId: string) => {
      return state.fileStats.get(componentId) || {
        totalCodes: 0,
        totalDestinations: 0,
        uniqueDestinationsPercentage: 0
      };
    },
    
    // In-memory storage getters
    getInMemoryData: state => (tableName: string) => {
      return state.inMemoryData.get(tableName) || [];
    },
    
    getInMemoryDataCount: state => (tableName: string) => {
      return state.inMemoryData.get(tableName)?.length || 0;
    },
    
    getInMemoryTables: state => {
      const result: Record<string, number> = {};
      state.inMemoryData.forEach((data, tableName) => {
        result[tableName] = data.length;
      });
      return result;
    },
  },

  actions: {
    setActiveReportType(type: ReportType) {
      this.activeReportType = type;
    },

    addFileUploaded(componentName: string, fileName: string) {
      this.filesUploaded.set(componentName, { fileName });
    },

    resetFiles() {
      this.filesUploaded.clear();
      this.reportsGenerated = false;
      this.pricingReport = null;
      this.codeReport = null;
      this.showUploadComponents = true;
      this.invalidRows.clear();
      this.inMemoryData.clear();
    },

    setReports(pricing: USPricingReport, code: USCodeReport) {
      this.pricingReport = pricing;
      this.codeReport = code;
      this.reportsGenerated = true;
      this.showUploadComponents = false;
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
      }
      
      this.filesUploaded.delete(componentName);

      // Reset reports if no files left
      if (this.filesUploaded.size === 0) {
        this.reportsGenerated = false;
        this.pricingReport = null;
        this.codeReport = null;
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
    }
  },
}) as unknown as () => DomainStore<USPricingReport, USCodeReport>;
