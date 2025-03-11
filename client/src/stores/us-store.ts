import { defineStore } from 'pinia';
import type { USPricingReport, USCodeReport, InvalidUsRow } from '../types/domains/us-types';
import type { ReportType } from '@/types';
import type { DomainStore } from '@/types';

export const useUsStore = defineStore('npanxxStore', {
  state: () => ({
    filesUploaded: new Map<string, { fileName: string }>(),
    showUploadComponents: true,
    reportsGenerated: false,
    activeReportType: 'files' as ReportType,
    pricingReport: null as USPricingReport | null,
    codeReport: null as USCodeReport | null,
    uploadingComponents: {} as Record<string, boolean>,
    tempFiles: {} as Record<string, File>,
    invalidRows: {} as Record<string, InvalidUsRow[]>,
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
      
    getInvalidRows: state => (fileName: string): InvalidUsRow[] => state.invalidRows[fileName] || [],
    
    hasInvalidRows: state => (fileName: string): boolean => 
      !!state.invalidRows[fileName] && state.invalidRows[fileName].length > 0,
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
      this.invalidRows = {};
    },

    setReports(pricing: USPricingReport, code: USCodeReport) {
      this.pricingReport = pricing;
      this.codeReport = code;
      this.reportsGenerated = true;
      this.showUploadComponents = false;
    },

    removeFile(componentName: string) {
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
    
    hasExistingFile(fileName: string): boolean {
      for (const file of this.filesUploaded.values()) {
        if (file.fileName === fileName) {
          return true;
        }
      }
      return false;
    },

    setComponentUploading(componentName: string, isUploading: boolean) {
      this.uploadingComponents[componentName] = isUploading;
    },
    
    // Temp file handling for preview
    setTempFile(componentName: string, file: File) {
      this.tempFiles[componentName] = file;
    },
    
    getTempFile(componentName: string): File | null {
      return this.tempFiles[componentName] || null;
    },
    
    clearTempFile(componentName: string) {
      delete this.tempFiles[componentName];
    },
    
    // Invalid rows handling
    addInvalidRow(fileName: string, row: InvalidUsRow) {
      if (!this.invalidRows[fileName]) {
        this.invalidRows[fileName] = [];
      }
      this.invalidRows[fileName].push(row);
    },
    
    clearInvalidRowsForFile(fileName: string) {
      this.invalidRows[fileName] = [];
    },
  },
}) as unknown as () => DomainStore<USPricingReport, USCodeReport>;
