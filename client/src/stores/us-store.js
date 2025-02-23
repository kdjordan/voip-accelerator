import { defineStore } from 'pinia';
export const useUsStore = defineStore('npanxxStore', {
    state: () => ({
        filesUploaded: new Map(),
        showUploadComponents: true,
        reportsGenerated: false,
        activeReportType: 'files',
        pricingReport: null,
        codeReport: null,
        uploadingComponents: {},
    }),
    getters: {
        isComponentDisabled: state => (componentName) => state.filesUploaded.has(componentName),
        isFull: (state) => state.filesUploaded.size === 2,
        getFileNames: (state) => Array.from(state.filesUploaded.values()).map(file => file.fileName),
        getActiveReportType: (state) => state.activeReportType,
        getPricingReport: (state) => state.pricingReport,
        getCodeReport: (state) => state.codeReport,
        getNumberOfFilesUploaded: state => state.filesUploaded.size,
        isComponentUploading: state => (componentName) => !!state.uploadingComponents[componentName],
    },
    actions: {
        setActiveReportType(type) {
            this.activeReportType = type;
        },
        addFileUploaded(componentName, fileName) {
            this.filesUploaded.set(componentName, { fileName });
        },
        resetFiles() {
            this.filesUploaded.clear();
            this.reportsGenerated = false;
            this.pricingReport = null;
            this.codeReport = null;
            this.showUploadComponents = true;
        },
        setReports(pricing, code) {
            // this.pricingReport = pricing;
            // this.codeReport = code;
            this.reportsGenerated = true;
            this.showUploadComponents = false;
        },
        removeFile(fileName) {
            this.filesUploaded.delete(fileName);
            // Reset reports if no files left
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
        setComponentUploading(componentName, isUploading) {
            // this.uploadingComponents[componentName] = isUploading;
        },
    },
});
