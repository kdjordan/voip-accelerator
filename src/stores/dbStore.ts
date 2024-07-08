import { type UploadedFileTracker, type FileUpload, type State } from '../../types/app-types';
import { defineStore } from 'pinia'



export const useDBstate = defineStore('useDBstate', {
  state: (): State => {
    return {
      globalDBVersion: 1,
      filesUploaded: new Map<string, FileUpload>() as UploadedFileTracker,
      globalFileIsUploading: false,
      componentFileIsUploading: undefined
    }
  },
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
        console.log('key ', key, value)
        if (key === componentName) {
          return value.fileName
        }
      }
      return '';

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
          azFileNames.push(file.fileName);
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
    removeFileNameFilesUploaded(fileName: string) {
      for (const [key, value] of this.filesUploaded) {
        if (value.fileName === fileName) {
          this.filesUploaded.delete(key);
          this.incrementGlobalDBVersion()
        }
      }
    },
    setComponentFileIsUploading(componentName: string | undefined) {
      console.log(componentName)
      this.componentFileIsUploading = componentName
    },
    setGlobalFileIsUploading(isUploading: boolean) {
      this.globalFileIsUploading = isUploading;
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