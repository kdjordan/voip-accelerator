import { type UploadedFileTracker, type FileUpload } from './../../types/app-types';
import { defineStore } from 'pinia'


export const useDBstore = defineStore('DBstate', {
  state: () => {
    return {
      globalDBVersion: 1,
      filesUploaded: new Map<string, FileUpload>() as UploadedFileTracker,
      globalFileIsUploading: false,
    }
  },
  getters: {
    isComponentDisabled: (state) => (componentName: string): boolean => {
      for (const comp of state.filesUploaded) {
        if (comp[0] === componentName) {
          return true;
        }
      }
      return false;
    },
    getIsAZfull(state) {
      let azFileCount = 0;
      state.filesUploaded.forEach(file => {
        if (file.dbName === 'az') {
          azFileCount++;
        }
      });
      return azFileCount === 2;
    },
    getAZFileNames(state) {
      const azFileNames: string[] = [];
      state.filesUploaded.forEach((file, fileName) => {
        if (file.dbName === 'az') {
          azFileNames.push(fileName);
        }
      });
      return azFileNames;
    },
    getIsUSfull(state) {
      let azFileCount = 0;
      state.filesUploaded.forEach(file => {
        if (file.dbName === 'us') {
          azFileCount++;
        }
      });
      return azFileCount === 2;
    },
    getUSFileNames(state) {
      const azFileNames: string[] = [];
      state.filesUploaded.forEach((file, fileName) => {
        if (file.dbName === 'us') {
          azFileNames.push(fileName);
        }
      });
      return azFileNames;
    },
  },
  actions: {
    setGlobalFileIsUploading(isUploading: boolean) {
      this.globalFileIsUploading = isUploading;
      console.log('in store setting globalUploading', this.globalFileIsUploading)
    },
    incrementGlobalDBVersion() {
      this.globalDBVersion++
      console.log('updatd globalDBVersion ', this.globalDBVersion)
    },
    addFileUploaded(componentName: string, dbName: string, fileName: string) {
      this.incrementGlobalDBVersion()
      // const dbPrefix = dbName.split('filesUploaded')[0]; // Assuming the dbName includes a prefix like 'AZfilesUploaded'
      this.filesUploaded.set(componentName, { dbName: dbName, fileName: fileName });
      // console.log('File added from initial state:', fileName, { db: dbPrefix, fileName });
    },
  },

})