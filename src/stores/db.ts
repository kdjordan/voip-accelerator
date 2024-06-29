import {defineStore } from 'pinia'

export const useDBstore = defineStore('DBstate', {
  state: () => {
    return {
      globalDBVersion: 1,
      globalFileIsUploading: false,
      AZfilesUploadedCount: 0,
      USfilesUploadedCount: 0,
      objectStoreNames: new Map<string, string>(),
    }
},
actions: {
  setGlobalFileIsUploading(isUploading: boolean) {
    this.globalFileIsUploading = isUploading;
    console.log('in store setting globalUploading', this.globalFileIsUploading)
  },
  incrementAzFileCount() {
    this.AZfilesUploadedCount++;
  },
  incrementUsFileCount() {
    this.USfilesUploadedCount++;
  },
  incrementGlobalDBVersion() {
    this.globalDBVersion++
  },
  setObjectStoreName(key: string, name: string) {
    this.objectStoreNames.set(key, name);
  }
},

})