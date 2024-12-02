import { defineStore } from 'pinia';
import type { USPricingReport, USCodeReport } from '../types/npanxx-types';
import { useSharedStore } from '@/domains/shared/store';
import type { ReportType } from '@/domains/shared/types/base-types';

export const useNpanxxStore = defineStore('npanxxStore', {
  state: () => ({
    filesUploaded: new Map<string, { fileName: string }>(),
    showUploadComponents: true,
    reportsGenerated: false,
    activeReportType: 'files' as ReportType,
    pricingReport: null as USPricingReport | null,
    codeReport: null as USCodeReport | null,
  }),

  getters: {
    isComponentDisabled: (state) => (componentName: string): boolean => {
      return state.filesUploaded.has(componentName);
    },

    isFull: (state): boolean => state.filesUploaded.size === 2,

    getFileNames: (state): string[] => {
      return Array.from(state.filesUploaded.values()).map(file => file.fileName);
    },

    getActiveReportUS: (state): ReportType => {
      if (!state.reportsGenerated) return 'files';
      return state.activeReportType;
    },

    getUsPricingReport: (state) => state.pricingReport,
    getUsCodeReport: (state) => state.codeReport,
  },

  actions: {
    setActiveReportType(type: ReportType) {
      this.activeReportType = type;
    },

    addFileUploaded(componentName: string, fileName: string) {
      const sharedDBStore = useSharedStore();
      this.filesUploaded.set(componentName, { fileName });
      sharedDBStore.incrementGlobalDBVersion();
    },

    resetFiles() {
      this.filesUploaded.clear();
      this.reportsGenerated = false;
      this.pricingReport = null;
      this.codeReport = null;
      this.showUploadComponents = true;
    },

    setReports(pricing: USPricingReport, code: USCodeReport) {
      this.pricingReport = pricing;
      this.codeReport = code;
      this.reportsGenerated = true;
      this.showUploadComponents = false;
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
    }
  },
});
