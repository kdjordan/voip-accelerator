import { defineStore } from 'pinia';
import type { USPricingReport, USCodeReport } from '../types/us-types';
import { useSharedStore } from '@/domains/shared/store';
import type { ReportType } from '@/domains/shared/types';
import type { DomainStore } from '@/domains/shared/types';

export const useNpanxxStore = defineStore('npanxxStore', {
  state: () => ({
    filesUploaded: new Map<string, { fileName: string }>(),
    showUploadComponents: true,
    reportsGenerated: false,
    activeReportType: 'files' as ReportType,
    pricingReport: null,
    codeReport: null,
    uploadingComponents: {},
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

    isComponentUploading:
      state =>
      (componentName: string): boolean =>
        !!state.uploadingComponents[componentName],
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
      // this.pricingReport = pricing;
      // this.codeReport = code;
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
    },
    checkFileNameAvailable(fileName: string): boolean {
      return this.filesUploaded.has(fileName);
    },

    setComponentUploading(componentName: string, isUploading: boolean) {
      // this.uploadingComponents[componentName] = isUploading;
    },
  },
}) as unknown as () => DomainStore<USPricingReport, USCodeReport>;
