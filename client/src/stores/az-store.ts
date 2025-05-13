import { defineStore } from 'pinia';
import type {
  AzPricingReport,
  AzCodeReport,
  InvalidAzRow,
  AZEnhancedCodeReport,
} from '@/types/domains/az-types';
import type { ReportType } from '@/types';
import { AZService } from '@/services/az.service';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types';

interface FileStats {
  totalCodes: number;
  totalDestinations: number;
  uniqueDestinationsPercentage: number;
}

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
    invalidRows: new Map<string, InvalidAzRow[]>(),
    fileStats: new Map<
      string,
      {
        totalCodes: number;
        totalDestinations: number;
        uniqueDestinationsPercentage: number;
      }
    >(),
    detailedComparisonTableName: null as string | null,
    isLoadingDetailedComparison: false,
    enhancedCodeReports: new Map<string, AZEnhancedCodeReport>(),
  }),

  getters: {
    isComponentDisabled: (state) => (componentName: string) => {
      return state.filesUploaded.has(componentName);
    },

    isComponentUploading: (state) => (componentName: string) => {
      return !!state.uploadingComponents[componentName];
    },

    isFull: (state) => state.filesUploaded.size === 2,

    getFileNames: (state) => Array.from(state.filesUploaded.values()).map((file) => file.fileName),

    getActiveReportType: (state) => state.activeReportType,

    getPricingReport: (state) => state.pricingReport,

    getCodeReport: (state) => {
      // If we have a full comparison report, return that
      if (state.reportsGenerated && state.codeReport) {
        return state.codeReport;
      }

      return null;
    },

    getFileNameByComponent: (state) => (componentId: string) => {
      const file = state.filesUploaded.get(componentId);
      return file ? file.fileName : '';
    },

    getDetailedComparisonTableName: (state) => state.detailedComparisonTableName,

    getIsLoadingDetailedComparison: (state) => state.isLoadingDetailedComparison,

    getNumberOfFilesUploaded: (state) => state.filesUploaded.size,

    hasExistingFile: (state) => (fileName: string) => {
      return Array.from(state.filesUploaded.values()).some((f) => f.fileName === fileName);
    },

    hasInvalidRows: (state) => (fileName: string) => {
      return state.invalidRows.has(fileName) && (state.invalidRows.get(fileName)?.length || 0) > 0;
    },

    getInvalidRowsForFile: (state) => (fileName: string) => {
      return state.invalidRows.get(fileName) || [];
    },

    getAllInvalidRows: (state) => {
      const result: Record<string, InvalidAzRow[]> = {};
      state.invalidRows.forEach((rows, fileName) => {
        result[fileName] = rows;
      });
      return result;
    },

    // isUsingMemoryStorage: () => {
    //   return true; // Always use memory storage since config was removed
    // },

    getFileStats: (state) => (componentId: string) => {
      return (
        state.fileStats.get(componentId) || {
          totalCodes: 0,
          totalDestinations: 0,
          uniqueDestinationsPercentage: 0,
        }
      );
    },

    hasSingleFileReport: (state) => {
      return state.fileStats.size > 0 && state.fileStats.size < 2;
    },

    // Getter for enhanced code reports
    getEnhancedReportByFile:
      (state) =>
      (fileName: string): AZEnhancedCodeReport | null => {
        return state.enhancedCodeReports.get(fileName) || null;
      },
  },

  actions: {
    addFileUploaded(componentName: string, fileName: string) {
      if (componentName.startsWith('az')) {
        this.filesUploaded.set(componentName, { fileName });
      }
    },

    async resetFiles() {
      const { deleteDatabase } = useDexieDB();

      try {
    
        await deleteDatabase(DBName.AZ);
        await deleteDatabase(DBName.AZ_PRICING_COMPARISON);
    
      } catch (dbError) {
        console.error('[az-store] Error deleting AZ Dexie databases:', dbError);
      }

      this.filesUploaded.clear();
      this.fileStats.clear();
      this.invalidRows.clear();
      this.pricingReport = null;
      this.codeReport = null;
      this.detailedComparisonTableName = null;
      this.reportsGenerated = false;
      this.activeReportType = 'files';
      this.enhancedCodeReports.clear();
    },

    setReports(pricing: AzPricingReport, code: AzCodeReport) {
      this.pricingReport = pricing;
      this.codeReport = code;
      this.reportsGenerated = true;
      // Don't clear single file reports or hide upload components
      this.activeReportType = 'files'; // Default to files view when reports are generated
    },

    setActiveReportType(type: ReportType) {
      this.activeReportType = type;
    },

    removeFile(fileName: string) {
      const tableName = fileName.toLowerCase().replace('.csv', '');

      // --- Call AZService to remove table from DexieDB ---
      const azService = new AZService();
      azService
        .removeTable(tableName)
        .then(() => {
      
        })
        .catch((error) => {
          console.error(`[az-store] Error removing Dexie table ${tableName}:`, error);
          // Optionally notify the user or handle the error further
        });
      // --- End DexieDB call ---

      // Find the component ID associated with this file
      let componentId = '';
      for (const [key, value] of this.filesUploaded.entries()) {
        if (value.fileName === fileName) {
          componentId = key;
          break;
        }
      }

      if (componentId) {
        // Remove the file from filesUploaded
        this.filesUploaded.delete(componentId);

        // Clear file stats for this component
        this.clearFileStats(componentId);

        // Clear enhanced code report for this file
        this.enhancedCodeReports.delete(fileName);

      } else {
        console.warn(`[AzStore] Could not find component ID for file ${fileName}`);
      }

      // Clear any invalid rows for this file
      this.invalidRows.delete(fileName);

      // Reset reports if we now have fewer than 2 files
      if (this.filesUploaded.size < 2) {
        this.reportsGenerated = false;
        this.pricingReport = null;
        this.codeReport = null;
        this.detailedComparisonTableName = null;
        this.activeReportType = 'files';
      }

      // Keep upload components visible
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

    setFileStats(
      componentId: string,
      stats: {
        totalCodes: number;
        totalDestinations: number;
        uniqueDestinationsPercentage: number;
      }
    ) {
      this.fileStats.set(componentId, stats);
    },

    clearFileStats(componentId: string) {
      this.fileStats.delete(componentId);
    },

    clearAllFileStats() {
      this.fileStats.clear();
    },

    setDetailedComparisonTableName(tableName: string | null) {
      this.detailedComparisonTableName = tableName;
    },

    setLoadingDetailedComparison(isLoading: boolean) {
      this.isLoadingDetailedComparison = isLoading;
    },

    // Action to set enhanced code report
    setEnhancedCodeReport(fileName: string, report: AZEnhancedCodeReport) {
      this.enhancedCodeReports.set(fileName, report);
    },
  },
});
