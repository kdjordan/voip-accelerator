import { defineStore } from 'pinia';
import type { AzPricingReport, AzCodeReport } from '@/types/az-types';
import type { DomainStore, ReportType } from '@/types';
import { JOURNEY_STATE, type JourneyState } from '@/constants/messages';

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

    getCodeReport: state => state.codeReport,

    getFileNameByComponent: state => (componentId: string) => {
      const file = state.filesUploaded.get(componentId);
      return file ? file.fileName : '';
    },

    getJourneyState: (state): JourneyState => {
      if (state.filesUploaded.size === 0) return JOURNEY_STATE.INITIAL;
      if (state.filesUploaded.size === 1) return JOURNEY_STATE.ONE_FILE;
      if (state.filesUploaded.size === 2 && !state.reportsGenerated) return JOURNEY_STATE.TWO_FILES;
      if (Object.values(state.uploadingComponents).some(isUploading => isUploading)) {
        return JOURNEY_STATE.PROCESSING;
      }
      return JOURNEY_STATE.REPORTS_READY;
    },

    hasExistingFile: state => (fileName: string) => {
      return Array.from(state.filesUploaded.values()).some(f => f.fileName === fileName);
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
      this.filesUploaded.delete(componentName);
      this.uploadingComponents[componentName] = false;

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
  },
}) as unknown as () => DomainStore<AzPricingReport, AzCodeReport>;
