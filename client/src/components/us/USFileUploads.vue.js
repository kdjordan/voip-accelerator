import { ref, reactive } from 'vue';
import { ArrowUpTrayIcon, DocumentIcon, TrashIcon, ArrowRightIcon } from '@heroicons/vue/24/outline';
import PreviewModal2 from '@/components/shared/PreviewModal2.vue';
import { useUsStore } from '@/stores/us-store';
import useDexieDB from '@/composables/useDexieDB';
import { USColumnRole, US_COLUMN_ROLE_OPTIONS } from '@/types/us-types';
import Papa from 'papaparse';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
// import { USService } from '@/services/us.service';
const usStore = useUsStore();
const { loadFromDexieDB } = useDexieDB();
// Component state
const component1 = ref('us1');
const component2 = ref('us2');
const isGeneratingReports = ref(false);
const isDragging = reactive({});
const showPreviewModal = ref(false);
const isModalValid = ref(false);
const columnMappings = ref({});
// Preview state
const previewData = ref([]);
const columns = ref([]);
const startLine = ref(1);
const activeComponent = ref('');
// const usService = new USService();
async function handleFileUploaded(componentName, fileName) {
    usStore.addFileUploaded(componentName, fileName);
    console.log(`File uploaded for ${componentName}: ${fileName}`);
}
async function handleReportsAction() {
    if (usStore.reportsGenerated) {
        usStore.showUploadComponents = false;
    }
    else {
        await generateReports();
    }
}
async function generateReports() {
    isGeneratingReports.value = true;
    // try {
    //   const fileNames = usStore.getFileNames;
    //   const file1Data = await loadFromDexieDB(DBName.US, fileNames[0]);
    //   const file2Data = await loadFromDexieDB(DBName.US, fileNames[1]);
    //   if (file1Data && file2Data) {
    //     const { pricing, code } = await makeNpanxxReportsApi({
    //       fileName1: fileNames[0].split('.')[0],
    //       fileName2: fileNames[1].split('.')[0],
    //       file1Data: file1Data as USStandardizedData[],
    //       file2Data: file2Data as USStandardizedData[],
    //     });
    //     if (pricing && code) {
    //       usStore.setReports(pricing, code);
    //     }
    //   }
    // } catch (error) {
    //   console.error('Error generating reports:', error);
    // } finally {
    //   isGeneratingReports.value = false;
    // }
}
// File handling functions
async function handleFileInput(event, componentId) {
    const file = event.target.files?.[0];
    if (!file)
        return;
    usStore.setTempFile(componentId, file);
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
            usStore.clearTempFile(componentId);
        },
    });
}
// Modal handlers
function handleMappingUpdate(newMappings) {
    columnMappings.value = newMappings;
}
async function handleModalConfirm(mappings) {
    const file = usStore.getTempFile(activeComponent.value);
    if (!file)
        return;
    showPreviewModal.value = false;
    usStore.setComponentUploading(activeComponent.value, true);
    try {
        // Convert mappings to column indices
        const columnMapping = {
            npanxx: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.NPANXX)?.[0] ?? -1),
            npa: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.NPA)?.[0] ?? -1),
            nxx: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.NXX)?.[0] ?? -1),
            interstate: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.INTERSTATE)?.[0] ?? -1),
            intrastate: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.INTRASTATE)?.[0] ?? -1),
            indeterminate: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.INDETERMINATE)?.[0] ?? -1),
        };
        // Process file with mappings
        // const result = await usService.processFile(file, columnMapping, startLine.value);
        // await handleFileUploaded(activeComponent.value, result.fileName);
    }
    catch (error) {
        console.error('Error processing file:', error);
    }
    finally {
        usStore.setComponentUploading(activeComponent.value, false);
        usStore.clearTempFile(activeComponent.value);
    }
}
function handleModalCancel() {
    showPreviewModal.value = false;
    usStore.clearTempFile(activeComponent.value);
    activeComponent.value = '';
}
async function handleRemoveFile(componentName) {
    try {
        const fileName = usStore.getFileNameByComponent(componentName);
        if (!fileName)
            return;
        const tableName = fileName.toLowerCase().replace('.csv', '');
        // await usService.removeTable(tableName);
        usStore.removeFile(componentName);
    }
    catch (error) {
        console.error('Error removing file:', error);
    }
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("relative border-2 rounded-lg p-8 min-h-[120px] flex items-center justify-center") }, ...{ class: (([
                __VLS_ctx.isDragging[__VLS_ctx.component1]
                    ? 'border-accent bg-fbWhite/10'
                    : !__VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component1)
                        ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600 dashed'
                        : '',
                __VLS_ctx.usStore.isComponentUploading(__VLS_ctx.component1)
                    ? 'animate-upload-pulse cursor-not-allowed'
                    : !__VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component1)
                        ? 'cursor-pointer'
                        : '',
                __VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component1)
                    ? 'bg-accent/20 border-2 border-solid border-accent/50'
                    : 'border-fbWhite',
            ])) }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ ...{ onChange: (e => __VLS_ctx.handleFileInput(e, __VLS_ctx.component1)) }, type: ("file"), accept: (".csv"), ...{ class: ("absolute inset-0 opacity-0") }, ...{ class: (({ 'pointer-events-none': __VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component1) })) }, disabled: ((__VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component1))), });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex flex-col h-full") }, });
    if (!__VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component1)) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex-1 flex items-center justify-center") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-center") }, });
        const __VLS_0 = __VLS_resolvedLocalAndGlobalComponents.ArrowUpTrayIcon;
        /** @type { [typeof __VLS_components.ArrowUpTrayIcon, ] } */
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({ ...{ class: ("w-6 h-6 text-accent mx-auto") }, }));
        const __VLS_2 = __VLS_1({ ...{ class: ("w-6 h-6 text-accent mx-auto") }, }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("mt-2 text-base text-foreground") }, });
    }
    if (__VLS_ctx.usStore.isComponentUploading(__VLS_ctx.component1)) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex-1 flex items-center justify-center") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-sizeMd text-accent") }, });
    }
    if (__VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component1)) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex-1 flex items-center justify-center") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center space-x-2") }, });
        const __VLS_6 = __VLS_resolvedLocalAndGlobalComponents.DocumentIcon;
        /** @type { [typeof __VLS_components.DocumentIcon, ] } */
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({ ...{ class: ("w-5 h-5 text-accent") }, }));
        const __VLS_8 = __VLS_7({ ...{ class: ("w-5 h-5 text-accent") }, }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-sizeLg text-accent") }, });
        (__VLS_ctx.usStore.getFileNameByComponent(__VLS_ctx.component1));
    }
    if (__VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component1)) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component1))))
                        return;
                    __VLS_ctx.handleRemoveFile(__VLS_ctx.component1);
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("relative border-2 rounded-lg p-8 min-h-[120px] flex items-center justify-center") }, ...{ class: (([
                __VLS_ctx.isDragging[__VLS_ctx.component2]
                    ? 'border-accent bg-fbWhite/10'
                    : !__VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component2)
                        ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600 '
                        : '',
                __VLS_ctx.usStore.isComponentUploading(__VLS_ctx.component2)
                    ? 'animate-upload-pulse cursor-not-allowed'
                    : !__VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component2)
                        ? 'cursor-pointer'
                        : '',
                __VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component2)
                    ? 'bg-accent/20 border-2 border-solid border-accent/50'
                    : 'border-fbWhite',
            ])) }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ ...{ onChange: (e => __VLS_ctx.handleFileInput(e, __VLS_ctx.component2)) }, type: ("file"), accept: (".csv"), ...{ class: ("absolute inset-0 opacity-0") }, ...{ class: (({ 'pointer-events-none': __VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component2) })) }, disabled: ((__VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component2))), });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex flex-col h-full") }, });
    if (!__VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component2)) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex-1 flex items-center justify-center") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-center") }, });
        const __VLS_18 = __VLS_resolvedLocalAndGlobalComponents.ArrowUpTrayIcon;
        /** @type { [typeof __VLS_components.ArrowUpTrayIcon, ] } */
        // @ts-ignore
        const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({ ...{ class: ("w-6 h-6 text-accent mx-auto") }, }));
        const __VLS_20 = __VLS_19({ ...{ class: ("w-6 h-6 text-accent mx-auto") }, }, ...__VLS_functionalComponentArgsRest(__VLS_19));
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("mt-2 text-base text-foreground") }, });
    }
    if (__VLS_ctx.usStore.isComponentUploading(__VLS_ctx.component2)) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex-1 flex items-center justify-center") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-sizeMd text-accent") }, });
    }
    if (__VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component2)) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex-1 flex items-center justify-center") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center space-x-2") }, });
        const __VLS_24 = __VLS_resolvedLocalAndGlobalComponents.DocumentIcon;
        /** @type { [typeof __VLS_components.DocumentIcon, ] } */
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({ ...{ class: ("w-5 h-5 text-accent") }, }));
        const __VLS_26 = __VLS_25({ ...{ class: ("w-5 h-5 text-accent") }, }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-sizeLg text-accent") }, });
        (__VLS_ctx.usStore.getFileNameByComponent(__VLS_ctx.component2));
    }
    if (__VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component2)) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.usStore.isComponentDisabled(__VLS_ctx.component2))))
                        return;
                    __VLS_ctx.handleRemoveFile(__VLS_ctx.component2);
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
    if (!__VLS_ctx.usStore.reportsGenerated) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.handleReportsAction) }, disabled: ((!__VLS_ctx.usStore.isFull || __VLS_ctx.isGeneratingReports)), ...{ class: ("px-6 py-2 bg-accent/20 border border-accent/50 hover:bg-accent/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:border disabled:border-gray-700") }, ...{ class: (({ 'animate-pulse': __VLS_ctx.isGeneratingReports })) }, });
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
        const __VLS_42 = __VLS_asFunctionalComponent(PreviewModal2, new PreviewModal2({ ...{ 'onUpdate:mappings': {} }, ...{ 'onUpdate:valid': {} }, ...{ 'onConfirm': {} }, ...{ 'onCancel': {} }, showModal: ((__VLS_ctx.showPreviewModal)), columns: ((__VLS_ctx.columns)), previewData: ((__VLS_ctx.previewData)), startLine: ((__VLS_ctx.startLine)), columnOptions: ((__VLS_ctx.US_COLUMN_ROLE_OPTIONS)), }));
        const __VLS_43 = __VLS_42({ ...{ 'onUpdate:mappings': {} }, ...{ 'onUpdate:valid': {} }, ...{ 'onConfirm': {} }, ...{ 'onCancel': {} }, showModal: ((__VLS_ctx.showPreviewModal)), columns: ((__VLS_ctx.columns)), previewData: ((__VLS_ctx.previewData)), startLine: ((__VLS_ctx.startLine)), columnOptions: ((__VLS_ctx.US_COLUMN_ROLE_OPTIONS)), }, ...__VLS_functionalComponentArgsRest(__VLS_42));
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
            US_COLUMN_ROLE_OPTIONS: US_COLUMN_ROLE_OPTIONS,
            usStore: usStore,
            component1: component1,
            component2: component2,
            isGeneratingReports: isGeneratingReports,
            isDragging: isDragging,
            showPreviewModal: showPreviewModal,
            isModalValid: isModalValid,
            previewData: previewData,
            columns: columns,
            startLine: startLine,
            handleReportsAction: handleReportsAction,
            handleFileInput: handleFileInput,
            handleMappingUpdate: handleMappingUpdate,
            handleModalConfirm: handleModalConfirm,
            handleModalCancel: handleModalCancel,
            handleRemoveFile: handleRemoveFile,
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
