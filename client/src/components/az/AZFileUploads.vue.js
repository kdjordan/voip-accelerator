import { ref, reactive } from 'vue';
import { ArrowUpTrayIcon, DocumentIcon, TrashIcon, ArrowRightIcon } from '@heroicons/vue/24/outline';
import PreviewModal2 from '@/components/shared/PreviewModal2.vue';
import { useAzStore } from '@/stores/az-store';
import useDexieDB from '@/composables/useDexieDB';
import AzComparisonWorker from '@/workers/az-comparison.worker?worker';
import { AZ_COLUMN_ROLE_OPTIONS } from '@/types/az-types';
import { DBName } from '@/types/app-types';
import { AZColumnRole } from '@/types/az-types';
import Papa from 'papaparse';
import { AZService } from '@/services/az.service';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const azStore = useAzStore();
const { loadFromDexieDB } = useDexieDB();
const azService = new AZService();
const isDragging = reactive({});
const isGeneratingReports = ref(false);
// Preview state
const showPreviewModal = ref(false);
const previewData = ref([]);
const columns = ref([]);
const startLine = ref(1);
const activeComponent = ref('');
// Preview state
const isModalValid = ref(false);
const columnMappings = ref({});
// Drag and drop handlers
function handleDragEnter(event, componentId) {
    event.preventDefault();
    isDragging[componentId] = true;
}
function handleDragLeave(event, componentId) {
    event.preventDefault();
    isDragging[componentId] = false;
}
function handleDrop(event, componentId) {
    event.preventDefault();
    isDragging[componentId] = false;
    // Add check for disabled state and other processing
    if (!azStore.isComponentUploading(componentId) &&
        !azStore.isComponentDisabled(componentId) &&
        !azStore.isComponentUploading('az1') &&
        !azStore.isComponentUploading('az2') &&
        event.dataTransfer?.files) {
        const file = event.dataTransfer.files[0];
        if (file) {
            handleFileSelected(file, componentId);
        }
    }
}
async function handleFileSelected(file, componentId) {
    if (azStore.isComponentUploading(componentId) || azStore.isComponentDisabled(componentId))
        return;
    // Check if file name already exists using store method
    if (azStore.hasExistingFile(file.name)) {
        alert('A file with this name has already been uploaded. Please rename the file and try again.');
        return;
    }
    azStore.setComponentUploading(componentId, true);
    try {
        await handleFileInput({ target: { files: [file] } }, componentId);
    }
    catch (error) {
        console.error('Error handling file:', error);
    }
    finally {
        azStore.setComponentUploading(componentId, false);
    }
}
async function handleFileUploaded(componentName, fileName) {
    console.log('adding file to store', componentName, fileName);
    azStore.addFileUploaded(componentName, fileName);
    console.log(`File uploaded for ${componentName}: ${fileName}`);
}
async function handleRemoveFile(componentName) {
    try {
        const fileName = azStore.getFileNameByComponent(componentName);
        if (!fileName)
            return;
        const tableName = fileName.toLowerCase().replace('.csv', '');
        await azService.removeTable(tableName);
        azStore.removeFile(componentName);
    }
    catch (error) {
        console.error('Error removing file:', error);
    }
}
async function handleReportsAction() {
    if (!azStore.isFull || isGeneratingReports.value)
        return;
    isGeneratingReports.value = true;
    try {
        console.log('Starting report generation with files:', azStore.getFileNames);
        // Load data from DexieDB
        const fileData = await Promise.all(azStore.getFileNames.map(async (fileName) => {
            console.log('Loading data for file:', fileName);
            // Remove .csv extension for store name
            const storeName = fileName.toLowerCase().replace('.csv', '');
            const data = await loadFromDexieDB(DBName.AZ, storeName);
            if (!data) {
                throw new Error(`No data found for file ${fileName}`);
            }
            return data;
        }));
        if (fileData.length === 2) {
            console.log('Making comparison with data lengths:', {
                file1Length: fileData[0].length,
                file2Length: fileData[1].length,
            });
            // Create worker and process data
            const worker = new AzComparisonWorker();
            const reports = await new Promise((resolve, reject) => {
                worker.onmessage = event => {
                    const { pricingReport, codeReport } = event.data;
                    resolve({ pricingReport, codeReport });
                };
                worker.onerror = error => {
                    console.error('Worker error:', error);
                    reject(error);
                };
                const input = {
                    fileName1: azStore.getFileNames[0],
                    fileName2: azStore.getFileNames[1],
                    file1Data: fileData[0],
                    file2Data: fileData[1],
                };
                worker.postMessage(input);
            });
            console.log('Reports generated:', {
                hasPricingReport: !!reports.pricingReport,
                hasCodeReport: !!reports.codeReport,
            });
            if (reports.pricingReport && reports.codeReport) {
                azStore.setReports(reports.pricingReport, reports.codeReport);
            }
            // Clean up worker
            worker.terminate();
        }
    }
    catch (error) {
        console.error('Error generating reports:', error);
        if (error instanceof Error) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
            });
        }
    }
    finally {
        isGeneratingReports.value = false;
    }
}
// File handling implementation...
async function handleFileInput(event, componentId) {
    const file = event.target.files?.[0];
    if (!file)
        return;
    azStore.setTempFile(componentId, file);
    Papa.parse(file, {
        preview: 5,
        complete: results => {
            previewData.value = results.data.slice(1);
            columns.value = results.data[0];
            activeComponent.value = componentId;
            showPreviewModal.value = true;
        },
        error: error => {
            console.error('Error parsing CSV:', error);
            azStore.clearTempFile(componentId);
        },
    });
}
// Modal handlers
async function handleModalConfirm(mappings) {
    const file = azStore.getTempFile(activeComponent.value);
    if (!file)
        return;
    showPreviewModal.value = false;
    azStore.setComponentUploading(activeComponent.value, true);
    try {
        // Convert the new mappings format to the expected columnMapping format
        const columnMapping = {
            destination: Number(Object.entries(mappings).find(([_, value]) => value === AZColumnRole.DESTINATION)?.[0] ?? -1),
            dialcode: Number(Object.entries(mappings).find(([_, value]) => value === AZColumnRole.DIALCODE)?.[0] ?? -1),
            rate: Number(Object.entries(mappings).find(([_, value]) => value === AZColumnRole.RATE)?.[0] ?? -1),
        };
        const result = await azService.processFile(file, columnMapping, startLine.value);
        await handleFileUploaded(activeComponent.value, result.fileName);
    }
    catch (error) {
        console.error('Error processing file:', error);
    }
    finally {
        azStore.setComponentUploading(activeComponent.value, false);
        azStore.clearTempFile(activeComponent.value);
    }
}
function handleModalCancel() {
    showPreviewModal.value = false;
    azStore.clearTempFile(activeComponent.value);
    activeComponent.value = '';
}
function handleMappingUpdate(newMappings) {
    columnMappings.value = newMappings;
}
; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_fnComponent = (await import('vue')).defineComponent({});
;
let __VLS_functionalComponentProps;
function __VLS_template() {
    const __VLS_ctx = {};
    const __VLS_localComponents = {
        ...{},
        ...{},
        ...__VLS_ctx,
    };
    let __VLS_components;
    const __VLS_localDirectives = {
        ...{},
        ...__VLS_ctx,
    };
    let __VLS_directives;
    let __VLS_styleScopedClasses;
    let __VLS_resolvedLocalAndGlobalComponents;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex flex-col gap-8 w-full") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("bg-gray-800 rounded-b-lg p-6") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("pb-4 mb-6") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("grid grid-cols-2 gap-8") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex flex-col gap-2") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({ ...{ class: ("text-base text-fbWhite mb-4") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onDragenter: (e => __VLS_ctx.handleDragEnter(e, 'az1')) }, ...{ onDragleave: (e => __VLS_ctx.handleDragLeave(e, 'az1')) }, ...{ onDragover: () => { } }, ...{ onDrop: (e => __VLS_ctx.handleDrop(e, 'az1')) }, ...{ class: ("relative border-2 rounded-lg p-8 min-h-[120px] flex items-center justify-center") }, ...{ class: (([
                __VLS_ctx.isDragging['az1']
                    ? 'border-accent bg-fbWhite/10'
                    : !__VLS_ctx.azStore.isComponentDisabled('az1')
                        ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600 dashed'
                        : '',
                __VLS_ctx.azStore.isComponentUploading('az1')
                    ? 'animate-upload-pulse cursor-not-allowed'
                    : !__VLS_ctx.azStore.isComponentDisabled('az1')
                        ? 'cursor-pointer'
                        : '',
                __VLS_ctx.azStore.isComponentDisabled('az1')
                    ? 'bg-accent/20 border-2 border-solid border-accent/50'
                    : 'border-fbWhite',
            ])) }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ ...{ onChange: (e => __VLS_ctx.handleFileInput(e, 'az1')) }, type: ("file"), accept: (".csv"), ...{ class: ("absolute inset-0 opacity-0") }, ...{ class: (({ 'pointer-events-none': __VLS_ctx.azStore.isComponentDisabled('az1') })) }, disabled: ((__VLS_ctx.azStore.isComponentUploading('az1') ||
            __VLS_ctx.azStore.isComponentUploading('az2') ||
            __VLS_ctx.azStore.isComponentDisabled('az1'))), });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex flex-col h-full") }, });
    if (!__VLS_ctx.azStore.isComponentDisabled('az1') && !__VLS_ctx.azStore.isComponentUploading('az1')) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex-1 flex items-center justify-center") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-center") }, });
        const __VLS_0 = __VLS_resolvedLocalAndGlobalComponents.ArrowUpTrayIcon;
        /** @type { [typeof __VLS_components.ArrowUpTrayIcon, ] } */
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({ ...{ class: ("w-6 h-6 text-accent mx-auto") }, }));
        const __VLS_2 = __VLS_1({ ...{ class: ("w-6 h-6 text-accent mx-auto") }, }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("mt-2 text-base text-foreground") }, });
    }
    if (__VLS_ctx.azStore.isComponentUploading('az1')) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex-1 flex items-center justify-center bg-accent/10 animate-upload-pulse w-full h-full absolute inset-0") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-sizeMd text-accent") }, });
    }
    if (__VLS_ctx.azStore.isComponentDisabled('az1')) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex-1 flex items-center justify-center") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center space-x-2") }, });
        const __VLS_6 = __VLS_resolvedLocalAndGlobalComponents.DocumentIcon;
        /** @type { [typeof __VLS_components.DocumentIcon, ] } */
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({ ...{ class: ("w-5 h-5 text-accent") }, }));
        const __VLS_8 = __VLS_7({ ...{ class: ("w-5 h-5 text-accent") }, }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-sizeLg text-accent") }, });
        (__VLS_ctx.azStore.getFileNameByComponent('az1'));
    }
    if (__VLS_ctx.azStore.isComponentDisabled('az1')) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.azStore.isComponentDisabled('az1'))))
                        return;
                    __VLS_ctx.handleRemoveFile('az1');
                } }, ...{ class: ("ml-auto px-4 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded-md transition-colors") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center justify-center space-x-2") }, });
        const __VLS_12 = __VLS_resolvedLocalAndGlobalComponents.TrashIcon;
        /** @type { [typeof __VLS_components.TrashIcon, ] } */
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({ ...{ class: ("w-3.5 h-3.5 text-red-400") }, }));
        const __VLS_14 = __VLS_13({ ...{ class: ("w-3.5 h-3.5 text-red-400") }, }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-xs text-red-400") }, });
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex flex-col gap-2") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({ ...{ class: ("text-base text-fbWhite mb-4") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onDragenter: (e => __VLS_ctx.handleDragEnter(e, 'az2')) }, ...{ onDragleave: (e => __VLS_ctx.handleDragLeave(e, 'az2')) }, ...{ onDragover: () => { } }, ...{ onDrop: (e => __VLS_ctx.handleDrop(e, 'az2')) }, ...{ class: ("relative border-2 rounded-lg p-8 min-h-[120px] flex items-center justify-center") }, ...{ class: (([
                __VLS_ctx.isDragging['az2']
                    ? 'border-accent bg-fbWhite/10'
                    : !__VLS_ctx.azStore.isComponentDisabled('az2')
                        ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600 '
                        : '',
                __VLS_ctx.azStore.isComponentUploading('az2')
                    ? 'animate-upload-pulse cursor-not-allowed'
                    : !__VLS_ctx.azStore.isComponentDisabled('az2')
                        ? 'cursor-pointer'
                        : '',
                __VLS_ctx.azStore.isComponentDisabled('az2')
                    ? 'bg-accent/20 border-2 border-solid border-accent/50'
                    : 'border-fbWhite',
            ])) }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ ...{ onChange: (e => __VLS_ctx.handleFileInput(e, 'az2')) }, type: ("file"), accept: (".csv"), ...{ class: ("absolute inset-0 opacity-0") }, ...{ class: (({ 'pointer-events-none': __VLS_ctx.azStore.isComponentDisabled('az2') })) }, disabled: ((__VLS_ctx.azStore.isComponentUploading('az2') ||
            __VLS_ctx.azStore.isComponentUploading('az1') ||
            __VLS_ctx.azStore.isComponentDisabled('az2'))), });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex flex-col h-full") }, });
    if (!__VLS_ctx.azStore.isComponentDisabled('az2') && !__VLS_ctx.azStore.isComponentUploading('az2')) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex-1 flex items-center justify-center") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-center") }, });
        const __VLS_18 = __VLS_resolvedLocalAndGlobalComponents.ArrowUpTrayIcon;
        /** @type { [typeof __VLS_components.ArrowUpTrayIcon, ] } */
        // @ts-ignore
        const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({ ...{ class: ("w-6 h-6 text-accent mx-auto") }, }));
        const __VLS_20 = __VLS_19({ ...{ class: ("w-6 h-6 text-accent mx-auto") }, }, ...__VLS_functionalComponentArgsRest(__VLS_19));
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("mt-2 text-base text-foreground") }, });
    }
    if (__VLS_ctx.azStore.isComponentUploading('az2')) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex-1 flex items-center justify-center bg-accent/10 animate-upload-pulse w-full h-full absolute inset-0") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-sizeMd text-accent") }, });
    }
    if (__VLS_ctx.azStore.isComponentDisabled('az2')) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex-1 flex items-center justify-center") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center space-x-2") }, });
        const __VLS_24 = __VLS_resolvedLocalAndGlobalComponents.DocumentIcon;
        /** @type { [typeof __VLS_components.DocumentIcon, ] } */
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({ ...{ class: ("w-5 h-5 text-accent") }, }));
        const __VLS_26 = __VLS_25({ ...{ class: ("w-5 h-5 text-accent") }, }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-sizeLg text-accent") }, });
        (__VLS_ctx.azStore.getFileNameByComponent('az2'));
    }
    if (__VLS_ctx.azStore.isComponentDisabled('az2')) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.azStore.isComponentDisabled('az2'))))
                        return;
                    __VLS_ctx.handleRemoveFile('az2');
                } }, ...{ class: ("ml-auto px-4 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded-md transition-colors") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center justify-center space-x-2") }, });
        const __VLS_30 = __VLS_resolvedLocalAndGlobalComponents.TrashIcon;
        /** @type { [typeof __VLS_components.TrashIcon, ] } */
        // @ts-ignore
        const __VLS_31 = __VLS_asFunctionalComponent(__VLS_30, new __VLS_30({ ...{ class: ("w-3.5 h-3.5 text-red-400") }, }));
        const __VLS_32 = __VLS_31({ ...{ class: ("w-3.5 h-3.5 text-red-400") }, }, ...__VLS_functionalComponentArgsRest(__VLS_31));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-xs text-red-400") }, });
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("border-t border-gray-700/50") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-end mt-8") }, });
    if (!__VLS_ctx.azStore.reportsGenerated) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.handleReportsAction) }, disabled: ((!__VLS_ctx.azStore.isFull || __VLS_ctx.isGeneratingReports)), ...{ class: ("px-6 py-2 bg-accent/20 border border-accent/50 hover:bg-accent/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:border disabled:border-gray-700") }, ...{ class: (({ 'animate-pulse': __VLS_ctx.isGeneratingReports })) }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center justify-center space-x-2") }, });
        const __VLS_36 = __VLS_resolvedLocalAndGlobalComponents.ArrowRightIcon;
        /** @type { [typeof __VLS_components.ArrowRightIcon, ] } */
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({ ...{ class: ("w-4 h-4 text-accent") }, }));
        const __VLS_38 = __VLS_37({ ...{ class: ("w-4 h-4 text-accent") }, }, ...__VLS_functionalComponentArgsRest(__VLS_37));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-sm text-accent") }, });
        (__VLS_ctx.isGeneratingReports ? 'GENERATING REPORTS' : 'Get Reports');
    }
    if (__VLS_ctx.showPreviewModal) {
        // @ts-ignore
        [PreviewModal2,];
        // @ts-ignore
        const __VLS_42 = __VLS_asFunctionalComponent(PreviewModal2, new PreviewModal2({ ...{ 'onUpdate:mappings': {} }, ...{ 'onUpdate:valid': {} }, ...{ 'onConfirm': {} }, ...{ 'onCancel': {} }, showModal: ((__VLS_ctx.showPreviewModal)), columns: ((__VLS_ctx.columns)), previewData: ((__VLS_ctx.previewData)), startLine: ((__VLS_ctx.startLine)), columnOptions: ((__VLS_ctx.AZ_COLUMN_ROLE_OPTIONS)), }));
        const __VLS_43 = __VLS_42({ ...{ 'onUpdate:mappings': {} }, ...{ 'onUpdate:valid': {} }, ...{ 'onConfirm': {} }, ...{ 'onCancel': {} }, showModal: ((__VLS_ctx.showPreviewModal)), columns: ((__VLS_ctx.columns)), previewData: ((__VLS_ctx.previewData)), startLine: ((__VLS_ctx.startLine)), columnOptions: ((__VLS_ctx.AZ_COLUMN_ROLE_OPTIONS)), }, ...__VLS_functionalComponentArgsRest(__VLS_42));
        let __VLS_47;
        const __VLS_48 = {
            'onUpdate:mappings': (__VLS_ctx.handleMappingUpdate)
        };
        const __VLS_49 = {
            'onUpdate:valid': (isValid => (__VLS_ctx.isModalValid = isValid))
        };
        const __VLS_50 = {
            onConfirm: (__VLS_ctx.handleModalConfirm)
        };
        const __VLS_51 = {
            onCancel: (__VLS_ctx.handleModalCancel)
        };
        let __VLS_44;
        let __VLS_45;
        var __VLS_46;
    }
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['flex-col'];
    __VLS_styleScopedClasses['gap-8'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['bg-gray-800'];
    __VLS_styleScopedClasses['rounded-b-lg'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['pb-4'];
    __VLS_styleScopedClasses['mb-6'];
    __VLS_styleScopedClasses['grid'];
    __VLS_styleScopedClasses['grid-cols-2'];
    __VLS_styleScopedClasses['gap-8'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['flex-col'];
    __VLS_styleScopedClasses['gap-2'];
    __VLS_styleScopedClasses['text-base'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['relative'];
    __VLS_styleScopedClasses['border-2'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['p-8'];
    __VLS_styleScopedClasses['min-h-[120px]'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['absolute'];
    __VLS_styleScopedClasses['inset-0'];
    __VLS_styleScopedClasses['opacity-0'];
    __VLS_styleScopedClasses['pointer-events-none'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['flex-col'];
    __VLS_styleScopedClasses['h-full'];
    __VLS_styleScopedClasses['flex-1'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['w-6'];
    __VLS_styleScopedClasses['h-6'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['mx-auto'];
    __VLS_styleScopedClasses['mt-2'];
    __VLS_styleScopedClasses['text-base'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['flex-1'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['bg-accent/10'];
    __VLS_styleScopedClasses['animate-upload-pulse'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['h-full'];
    __VLS_styleScopedClasses['absolute'];
    __VLS_styleScopedClasses['inset-0'];
    __VLS_styleScopedClasses['text-sizeMd'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['flex-1'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['space-x-2'];
    __VLS_styleScopedClasses['w-5'];
    __VLS_styleScopedClasses['h-5'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['text-sizeLg'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['ml-auto'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-1.5'];
    __VLS_styleScopedClasses['bg-red-950'];
    __VLS_styleScopedClasses['hover:bg-red-900'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-red-500/50'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['space-x-2'];
    __VLS_styleScopedClasses['w-3.5'];
    __VLS_styleScopedClasses['h-3.5'];
    __VLS_styleScopedClasses['text-red-400'];
    __VLS_styleScopedClasses['text-xs'];
    __VLS_styleScopedClasses['text-red-400'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['flex-col'];
    __VLS_styleScopedClasses['gap-2'];
    __VLS_styleScopedClasses['text-base'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['relative'];
    __VLS_styleScopedClasses['border-2'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['p-8'];
    __VLS_styleScopedClasses['min-h-[120px]'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['absolute'];
    __VLS_styleScopedClasses['inset-0'];
    __VLS_styleScopedClasses['opacity-0'];
    __VLS_styleScopedClasses['pointer-events-none'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['flex-col'];
    __VLS_styleScopedClasses['h-full'];
    __VLS_styleScopedClasses['flex-1'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['w-6'];
    __VLS_styleScopedClasses['h-6'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['mx-auto'];
    __VLS_styleScopedClasses['mt-2'];
    __VLS_styleScopedClasses['text-base'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['flex-1'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['bg-accent/10'];
    __VLS_styleScopedClasses['animate-upload-pulse'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['h-full'];
    __VLS_styleScopedClasses['absolute'];
    __VLS_styleScopedClasses['inset-0'];
    __VLS_styleScopedClasses['text-sizeMd'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['flex-1'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['space-x-2'];
    __VLS_styleScopedClasses['w-5'];
    __VLS_styleScopedClasses['h-5'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['text-sizeLg'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['ml-auto'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-1.5'];
    __VLS_styleScopedClasses['bg-red-950'];
    __VLS_styleScopedClasses['hover:bg-red-900'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-red-500/50'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['space-x-2'];
    __VLS_styleScopedClasses['w-3.5'];
    __VLS_styleScopedClasses['h-3.5'];
    __VLS_styleScopedClasses['text-red-400'];
    __VLS_styleScopedClasses['text-xs'];
    __VLS_styleScopedClasses['text-red-400'];
    __VLS_styleScopedClasses['border-t'];
    __VLS_styleScopedClasses['border-gray-700/50'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-end'];
    __VLS_styleScopedClasses['mt-8'];
    __VLS_styleScopedClasses['px-6'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['bg-accent/20'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-accent/50'];
    __VLS_styleScopedClasses['hover:bg-accent/30'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['disabled:opacity-50'];
    __VLS_styleScopedClasses['disabled:cursor-not-allowed'];
    __VLS_styleScopedClasses['disabled:bg-gray-800'];
    __VLS_styleScopedClasses['disabled:border'];
    __VLS_styleScopedClasses['disabled:border-gray-700'];
    __VLS_styleScopedClasses['animate-pulse'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['space-x-2'];
    __VLS_styleScopedClasses['w-4'];
    __VLS_styleScopedClasses['h-4'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-accent'];
    var __VLS_slots;
    var __VLS_inheritedAttrs;
    const __VLS_refs = {};
    var $refs;
    var $el;
    return {
        attrs: {},
        slots: __VLS_slots,
        refs: $refs,
        rootEl: $el,
    };
}
;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ArrowUpTrayIcon: ArrowUpTrayIcon,
            DocumentIcon: DocumentIcon,
            TrashIcon: TrashIcon,
            ArrowRightIcon: ArrowRightIcon,
            PreviewModal2: PreviewModal2,
            AZ_COLUMN_ROLE_OPTIONS: AZ_COLUMN_ROLE_OPTIONS,
            azStore: azStore,
            isDragging: isDragging,
            isGeneratingReports: isGeneratingReports,
            showPreviewModal: showPreviewModal,
            previewData: previewData,
            columns: columns,
            startLine: startLine,
            isModalValid: isModalValid,
            handleDragEnter: handleDragEnter,
            handleDragLeave: handleDragLeave,
            handleDrop: handleDrop,
            handleRemoveFile: handleRemoveFile,
            handleReportsAction: handleReportsAction,
            handleFileInput: handleFileInput,
            handleModalConfirm: handleModalConfirm,
            handleModalCancel: handleModalCancel,
            handleMappingUpdate: handleMappingUpdate,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEl: {},
});
; /* PartiallyEnd: #4569/main.vue */
