import { defineStore } from 'pinia';
import type { AzPricingReport, AzCodeReport } from '../types/az-types';
import type { DomainStore, ReportType } from '@/domains/shared/types';


export const useAzStore = defineStore('azStore', {
  state: () => ({
    filesUploaded: new Map<string, { fileName: string }>(),
    uploadingComponents: {} as Record<string, boolean>,
    showUploadComponents: true,
    reportsGenerated: false,
    activeReportType: 'files' as ReportType,
    pricingReport: null as AzPricingReport | null,
    codeReport: null as AzCodeReport | null,
  }),

  getters: {
    isComponentDisabled: (state) => (componentName: string) => {
      return state.filesUploaded.has(componentName);
    },

    isComponentUploading: (state) => (componentName: string) => {
      return !!state.uploadingComponents[componentName];
    },

    isFull: (state) => state.filesUploaded.size === 2,

    getFileNames: (state) => 
      Array.from(state.filesUploaded.values()).map(file => file.fileName),

    getActiveReportType: (state) => state.activeReportType,
    
    getPricingReport: (state) => state.pricingReport,
    
    getCodeReport: (state) => state.codeReport,
  },

  actions: {
    addFileUploaded(componentName: string, fileName: string) {
      this.filesUploaded.set(componentName, { fileName });
    },

    resetFiles() {
      this.filesUploaded.clear();
      this.reportsGenerated = false;
      this.pricingReport = null;
      this.codeReport = null;
      this.showUploadComponents = true;
    },

    setReports(pricing: AzPricingReport, code: AzCodeReport) {
      this.pricingReport = pricing;
      this.codeReport = code;
      this.reportsGenerated = true;
      this.showUploadComponents = false;
    },

    setActiveReportType(type: ReportType) {
      this.activeReportType = type;
    },

    removeFile(componentName: string) {
      // Remove the file from the map
      this.filesUploaded.delete(componentName);
      
      // Reset upload state for this component
      this.uploadingComponents[componentName] = false;
      
      // Reset reports if no files left
      if (this.filesUploaded.size === 0) {
        this.reportsGenerated = false;
        this.pricingReport = null;
        this.codeReport = null;
        this.showUploadComponents = true;
        this.activeReportType = 'files';
      }
    },

    checkFileNameAvailable(fileName: string): boolean {
      return this.filesUploaded.has(fileName);
    },

    setComponentFileIsUploading(componentName: string): void {
      this.setComponentUploading(componentName, true);
    },

    getStoreNameByComponent(componentName: string): string {
      return `${componentName}-store`;
    },

    setComponentUploading(componentName: string, isUploading: boolean) {
      this.uploadingComponents[componentName] = isUploading;
    },
  },
}) as unknown as () => DomainStore<AzPricingReport, AzCodeReport>;
