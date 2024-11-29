import { type UploadedFileTracker, type FileUpload, DBName, type AzPricingReport, type AzCodeReport } from '../types/app-types';
import { defineStore } from 'pinia'
import { ReportState, type ReportStateType } from '../types/app-types';

export const useDBstate = defineStore('dbStore', {
  state: () => ({
    globalDBVersion: 1,
    filesUploaded: new Map<string, FileUpload>() as UploadedFileTracker,
    globalFileIsUploading: false,
    componentFileIsUploading: undefined as string | undefined,
    showAzUploadComponents: true,
    azReportsGenerated: false,
    azPricingReport: null as AzPricingReport | null,
    azCodeReport: null as AzCodeReport | null,
    activeReportAZ: ReportState.FILES as ReportStateType,
    activeReportUS: ReportState.FILES as ReportStateType,
  }),
  
  getters: {
    checkFileNameAvailable: (state) => {
      return (fileName: string) => {
        for (const fileUpload of state.filesUploaded.values()) {
          if (fileUpload.fileName === fileName) {
            return true;
          }
        }
        return false;
      };
    },
    isComponentFileUploading: (state) => (componentName: string): boolean => {
      return componentName === state.componentFileIsUploading
    },
    //will be disabled if componentName had is a key of filesUploaded
    isComponentDisabled: (state) => (componentName: string): boolean => {
      for (const [key,] of state.filesUploaded) {
        if (key === componentName) {
          return true;
        }
      }
      return false;
    },
    getStoreNameByComponent: (state) => (componentName: string): string => {
      for (const [key, value] of state.filesUploaded) {
        if (key === componentName) {
          return value.fileName
        }
      }
      return '';

    },
    getIsAZfull: (state) => {
      let count = 0;
      for (const file of state.filesUploaded.values()) {
        if (file.dbName === 'az') {
          count++;
          if (count === 2) return true;
        }
      }
      return false;
    },
    getAZFileNames(): string[] {
      return this.getFileNamesForDB(DBName.AZ);
    },
    getIsUSfull(): boolean {
      return this.getFileCountForDB(DBName.US) === 2;
    },
    getUSFileNames(): string[] {
      return this.getFileNamesForDB(DBName.US);
    },
    getFileCountForDB: (state) => (dbName: DBName) => {
      return Array.from(state.filesUploaded.values()).filter(file => file.dbName === dbName).length;
    },
    getFileNamesForDB: (state) => (dbName: DBName) => {
      return Array.from(state.filesUploaded.values())
        .filter(file => file.dbName === dbName)
        .map(file => file.fileName);
    },
    getAllUploadedFiles: (state) => {
      return Array.from(state.filesUploaded.entries()).map(([componentName, file]) => ({
        componentName,
        dbName: file.dbName,
        fileName: file.fileName
      }));
    },
    getAzReportsGenerated: (state) => state.azReportsGenerated,
    getAzPricingReport: (state) => state.azPricingReport,
    getAzCodeReport: (state) => state.azCodeReport,
    getActiveReportAZ: (state) => state.activeReportAZ,
    getActiveReportUS: (state) => state.activeReportUS,
  },
  actions: {
    async resetAzReportInStore() {
      try {
        console.log('Resetting the AZ report');
        this.resetFilesUploadedByDBname(DBName.AZ);
        this.azReportsGenerated = false;
        this.azPricingReport = null;
        this.azCodeReport = null;
        this.showAzUploadComponents = true;
        console.log('AZ reports and uploaded files reset successfully');
      } catch (error) {
        console.error('Error resetting AZ reports:', error);
      }
    },
    removeFileNameFilesUploaded(fileName: string) {
      let fileRemoved = false;
      for (const [key, value] of this.filesUploaded) {
        if (value.fileName === fileName) {
          this.filesUploaded.delete(key);
          fileRemoved = true;
          break;
        }
      }
      if (fileRemoved) {
        this.incrementGlobalDBVersion();
      } else {
        console.warn(`File not found for removal: ${fileName}`);
      }
    },
    setComponentFileIsUploading(componentName: string | undefined) {
      this.componentFileIsUploading = componentName;
    },
    setGlobalFileIsUploading(isUploading: boolean) {
      this.globalFileIsUploading = isUploading;
    },
    incrementGlobalDBVersion() {
      this.globalDBVersion++
      console.log('updatd globalDBVersion ', this.globalDBVersion)
    },
    addFileUploaded(componentName: string, dbName: DBName, fileName: string) {
      if (this.filesUploaded.has(componentName)) {
        console.warn(`Overwriting existing file for component: ${componentName}`);
      }
      this.incrementGlobalDBVersion();
      this.filesUploaded.set(componentName, { dbName, fileName });
    },
    resetFilesUploadedByDBname(dbName: DBName) {
      const keysToDelete: string[] = [];
      this.filesUploaded.forEach((value, key) => {
        if (value.dbName === dbName) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => {
        this.filesUploaded.delete(key);
      });
      if (keysToDelete.length > 0) {
        this.incrementGlobalDBVersion();
      }
    },
    setShowAzUploadComponents(show: boolean) {
      this.showAzUploadComponents = show;
    },
    setAzReportsGenerated(generated: boolean) {
      this.azReportsGenerated = generated;
    },
    setAzPricingReport(report: AzPricingReport | null) {
      this.azPricingReport = report;
    },
    setAzCodeReport(report: AzCodeReport | null) {
      this.azCodeReport = report;
    },
    resetAzReports() {
      this.azReportsGenerated = false;
      this.azPricingReport = null;
      this.azCodeReport = null;
    },
    setActiveReportAZ(report: ReportStateType) {
      this.activeReportAZ = report;
    },
    setActiveReportUS(report: ReportStateType) {
      this.activeReportUS = report;
    },
  },

})