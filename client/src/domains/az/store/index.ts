import { defineStore } from 'pinia';
import type { AzCodeReport, AzPricingReport } from '../types/az-types';
import { ReportTypes, type ReportType } from '@/domains/shared/types';

export const useAzStore = defineStore('az', {
  state: () => ({
    files: {
      az1: '',
      az2: '',
    },
    reportsGenerated: false,
    showUploadComponents: true,
    activeReportType: ReportTypes.FILES as ReportType,
    codeReport: null as AzCodeReport | null,
    pricingReport: null as AzPricingReport | null,
  }),

  getters: {
    isFull: state => Boolean(state.files.az1 && state.files.az2),
    getFileNames: state => [state.files.az1, state.files.az2],
  },

  actions: {
    addFileUploaded(componentName: string, fileName: string) {
      if (componentName === 'az1') {
        this.files.az1 = fileName;
      } else if (componentName === 'az2') {
        this.files.az2 = fileName;
      }
    },

    setActiveReportType(type: ReportType) {
      this.activeReportType = type;
    },

    setReports(pricing: AzPricingReport, code: AzCodeReport) {
      this.pricingReport = pricing;
      this.codeReport = code;
      this.reportsGenerated = true;
      this.showUploadComponents = false;
    },

    resetFiles() {
      this.files.az1 = '';
      this.files.az2 = '';
      this.reportsGenerated = false;
      this.showUploadComponents = true;
      this.codeReport = null;
      this.pricingReport = null;
    },

    isComponentDisabled(componentName: string): boolean {
      return false; // Implement your logic here
    },
  },
});
