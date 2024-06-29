import { type UploadedFileTracker } from './../../types/app-types';
import { defineStore } from 'pinia'


export const useDBstore = defineStore('DBstate', {
  state: () => {
    return {
      globalDBVersion: 1,
      globalFileIsUploading: false,
      AZfilesUploaded : {
        file1: '',
        file2: '',
        fileCount: 0
      } as UploadedFileTracker,
      USfilesUploaded: {
        file1: '',
        file2: '',
        fileCount: 0
      } as UploadedFileTracker,
      objectStoreNames: new Map<string, string>(),
    }
  },
  actions: {
    setGlobalFileIsUploading(isUploading: boolean) {
      this.globalFileIsUploading = isUploading;
      console.log('in store setting globalUploading', this.globalFileIsUploading)
    },
    incrementAzFileCount() {
      this.AZfilesUploaded.fileCount++;
      console.log('updatd AZcount ', this.AZfilesUploaded.fileCount)
    },
    incrementUsFileCount() {
      this.USfilesUploaded.fileCount++;
    },
    incrementGlobalDBVersion() {
      this.globalDBVersion++
      console.log('updatd globalDBVersion ', this.globalDBVersion)
    },
    addFilenameTracking(dbName: string, fileName: string) {
      if(dbName === 'az') {
        this.AZfilesUploaded.file1 === '' ? this.AZfilesUploaded.file1 = fileName : this.AZfilesUploaded.file2 = fileName
      } else if (dbName === 'us') {
        this.USfilesUploaded.file1 === '' ? this.USfilesUploaded.file1 = fileName : this.USfilesUploaded.file2 = fileName
      }
    },
    setObjectStoreName(key: string, name: string) {
      this.objectStoreNames.set(key, name);
    }
  },

})