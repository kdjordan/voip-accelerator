import { defineStore } from 'pinia';
import type { AzPricingReport, AzCodeReport } from '../types/az-types';
import type { ReportType, DomainStore } from '@/domains/shared/types';


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
    isComponentDisabled:
      state =>
      (componentName: string): boolean => {
        return state.filesUploaded.has(componentName);
      },

    isComponentUploading:
      state =>
      (componentName: string): boolean => {
        return !!state.uploadingComponents[componentName];
      },

    isFull: (state): boolean => state.filesUploaded.size === 2,

    getFileNames: (state): string[] => {
      return Array.from(state.filesUploaded.values()).map(file => file.fileName);
    },

    getActiveReportAZ: (state): 'files' | 'code' | 'pricing' => {
      if (!state.reportsGenerated) return 'files';
      return state.showUploadComponents ? 'files' : 'pricing';
    },

    getPricingReport: (state): AzPricingReport | null => state.pricingReport,
    getCodeReport: (state): AzCodeReport | null => state.codeReport,
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

    removeFile(fileName: string) {
      this.filesUploaded.delete(fileName);

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
      // implementation
    },

    getStoreNameByComponent(componentName: string): string {
      // implementation
      return componentName;
    },

    setComponentUploading(componentName: string, isUploading: boolean) {
      this.uploadingComponents[componentName] = isUploading;
    },
  },
}) as unknown as () => DomainStore<AzPricingReport, AzCodeReport>;
