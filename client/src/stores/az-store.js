import { defineStore } from 'pinia';
export const useAzStore = defineStore('az', {
    state: () => ({
        filesUploaded: new Map(),
        uploadingComponents: {},
        showUploadComponents: true,
        reportsGenerated: false,
        activeReportType: 'files',
        pricingReport: null,
        codeReport: null,
        tempFiles: new Map(),
    }),
    getters: {
        isComponentDisabled: state => (componentName) => {
            return state.filesUploaded.has(componentName);
        },
        isComponentUploading: state => (componentName) => {
            return !!state.uploadingComponents[componentName];
        },
        isFull: state => state.filesUploaded.size === 2,
        getFileNames: state => Array.from(state.filesUploaded.values()).map(file => file.fileName),
        getActiveReportType: state => state.activeReportType,
        getPricingReport: state => state.pricingReport,
        getCodeReport: state => state.codeReport,
        getFileNameByComponent: state => (componentId) => {
            const file = state.filesUploaded.get(componentId);
            return file ? file.fileName : '';
        },
        getNumberOfFilesUploaded: state => state.filesUploaded.size,
        hasExistingFile: state => (fileName) => {
            return Array.from(state.filesUploaded.values()).some(f => f.fileName === fileName);
        },
    },
    actions: {
        addFileUploaded(componentName, fileName) {
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
        setReports(pricing, code) {
            this.pricingReport = pricing;
            this.codeReport = code;
            this.reportsGenerated = true;
            this.showUploadComponents = false;
        },
        setActiveReportType(type) {
            this.activeReportType = type;
        },
        removeFile(componentName) {
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
        checkFileNameAvailable(fileName) {
            return this.filesUploaded.has(fileName);
        },
        setComponentFileIsUploading(componentName) {
            this.setComponentUploading(componentName, true);
        },
        getStoreNameByComponent(componentName) {
            return `${componentName}`;
        },
        setComponentUploading(componentName, isUploading) {
            this.uploadingComponents[componentName] = isUploading;
        },
        setTempFile(componentId, file) {
            this.tempFiles.set(componentId, file);
        },
        getTempFile(componentId) {
            return this.tempFiles.get(componentId);
        },
        clearTempFile(componentId) {
            this.tempFiles.delete(componentId);
        },
    },
});
