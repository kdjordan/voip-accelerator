import { defineStore } from 'pinia';
import type { USCodeReport, USPricingReport } from '../types/us-types';
import { ReportTypes, type ReportType } from '@/domains/shared/types';
import type { DomainStore } from '@/domains/shared/types';

export const useUsStore = defineStore('us', {
  state: () => ({
    files: {
      us1: '',
      us2: '',
    },
    reportsGenerated: false,
    showUploadComponents: true,
    activeReportType: ReportTypes.FILES as ReportType,
    codeReport: null as USCodeReport | null,
    pricingReport: null as USPricingReport | null,
  }),

  getters: {
    isFull: state => Boolean(state.files.us1 && state.files.us2),
    getFileNames: state => [state.files.us1, state.files.us2],
    getPricingReport: state => state.pricingReport,
  },

  actions: {
    addFileUploaded(componentName: string, fileName: string) {
      if (componentName === 'us1') {
        this.files.us1 = fileName;
      } else if (componentName === 'us2') {
        this.files.us2 = fileName;
      }
    },

    setActiveReportType(type: ReportType) {
      this.activeReportType = type;
    },

    setReports(pricing: USPricingReport, code: USCodeReport) {
      this.pricingReport = pricing;
      this.codeReport = code;
      this.reportsGenerated = true;
      this.showUploadComponents = false;
    },

    isComponentDisabled(componentName: string): boolean {
      return false; // Implement your logic here
    },
  },
}) as unknown as () => DomainStore<USPricingReport, USCodeReport>;
