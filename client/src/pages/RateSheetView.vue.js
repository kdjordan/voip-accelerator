import { computed, ref } from 'vue';
import { useRateSheetStore } from '@/stores/rate-sheet-store';
import { ArrowUpTrayIcon } from '@heroicons/vue/24/outline';
import RateSheetTable from '@/components/rate-sheet/RateSheetTable.vue';
import PreviewModal2 from '@/components/shared/PreviewModal2.vue';
import { RF_COLUMN_ROLE_OPTIONS } from '@/types/rate-sheet-types';
import Papa from 'papaparse';
import { RateSheetService } from '@/services/rate-sheet.service';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const store = useRateSheetStore();
const rateSheetService = new RateSheetService();
const isLocallyStored = computed(() => store.isLocallyStored);
const isDragging = ref(false);
const isProcessing = ref(false);
const uploadError = ref(null);
const rfUploadStatus = ref(null);
const isRFUploading = ref(false);
// Preview Modal state
const showPreviewModal = ref(false);
const previewData = ref([]);
const columns = ref([]);
const startLine = ref(1);
const columnMappings = ref({});
const isValid = ref(false);
const selectedFile = ref(null);
async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file)
        return;
    selectedFile.value = file;
    Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
            columns.value = results.data[0].map(h => h.trim());
            previewData.value = results.data
                .slice(0, 10)
                .map(row => (Array.isArray(row) ? row.map(cell => cell?.trim() || '') : []));
            startLine.value = 1;
            showPreviewModal.value = true;
        },
    });
}
async function handleRfFileDrop(event) {
    event.preventDefault();
    isDragging.value = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
        await handleFileChange({ target: { files: [file] } });
    }
}
async function handleModalConfirm(mappings) {
    showPreviewModal.value = false;
    const file = selectedFile.value;
    if (!file)
        return;
    isRFUploading.value = true;
    try {
        // Convert the new mappings format to the expected columnMapping format
        const columnMapping = {
            name: Number(Object.entries(mappings).find(([_, value]) => value === 'name')?.[0] ?? -1),
            prefix: Number(Object.entries(mappings).find(([_, value]) => value === 'prefix')?.[0] ?? -1),
            rate: Number(Object.entries(mappings).find(([_, value]) => value === 'rate')?.[0] ?? -1),
            effective: Number(Object.entries(mappings).find(([_, value]) => value === 'effective')?.[0] ?? -1),
            minDuration: Number(Object.entries(mappings).find(([_, value]) => value === 'minDuration')?.[0] ?? -1),
            increments: Number(Object.entries(mappings).find(([_, value]) => value === 'increments')?.[0] ?? -1),
        };
        const result = await rateSheetService.processFile(file, columnMapping, startLine.value);
        store.setOptionalFields(mappings);
        rfUploadStatus.value = { type: 'success', message: 'Rate sheet processed successfully' };
    }
    catch (error) {
        console.error('Failed to process rate sheet:', error);
        rfUploadStatus.value = {
            type: 'error',
            message: error instanceof Error ? error.message : 'Failed to process rate sheet',
        };
    }
    finally {
        isRFUploading.value = false;
        selectedFile.value = null;
    }
}
function handleModalCancel() {
    showPreviewModal.value = false;
    selectedFile.value = null;
}
function handleMappingUpdate(newMappings) {
    columnMappings.value = newMappings;
}
function handleDragEnter(event) {
    event.preventDefault();
    isDragging.value = true;
}
function handleDragLeave(event) {
    event.preventDefault();
    isDragging.value = false;
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("min-h-screen text-white p-8 w-full") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({ ...{ class: ("mb-8") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-sizeXl tracking-wide text-accent uppercase px-4 py-2") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("bg-gray-800 rounded-lg overflow-hidden") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("p-6 border-b border-gray-700/50") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("grid grid-cols-1 gap-3") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({ ...{ class: ("text-gray-400") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center space-x-2") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("w-3 h-3 rounded-full") }, ...{ class: (([
                __VLS_ctx.isLocallyStored
                    ? 'bg-green-500 animate-status-pulse-success'
                    : 'bg-red-500 animate-status-pulse-error',
            ])) }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.isLocallyStored ? 'Data Stored' : 'No Data');
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({ ...{ class: ("text-gray-400") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-2xl font-bold") }, });
    (__VLS_ctx.store.getDiscrepancyCount);
    if (!__VLS_ctx.isLocallyStored) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("mt-6") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onDragover: () => { } }, ...{ onDrop: (__VLS_ctx.handleRfFileDrop) }, ...{ class: ("border-2 border-dashed border-gray-600 p-8 text-center relative") }, ...{ class: (([
                    __VLS_ctx.isDragging ? 'border-green-500' : '',
                    __VLS_ctx.rfUploadStatus?.type === 'error' ? 'border-red-500' : '',
                    __VLS_ctx.isRFUploading ? 'border-blue-500' : '',
                ])) }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ ...{ onChange: (__VLS_ctx.handleFileChange) }, type: ("file"), accept: (".csv"), ...{ class: ("absolute inset-0 h-full opacity-0 cursor-pointer") }, disabled: ((__VLS_ctx.isProcessing)), });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-center") }, });
        const __VLS_0 = __VLS_resolvedLocalAndGlobalComponents.ArrowUpTrayIcon;
        /** @type { [typeof __VLS_components.ArrowUpTrayIcon, ] } */
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({ ...{ class: ("w-6 h-6 mx-auto") }, ...{ class: ((__VLS_ctx.uploadError ? 'text-red-500' : 'text-accent')) }, }));
        const __VLS_2 = __VLS_1({ ...{ class: ("w-6 h-6 mx-auto") }, ...{ class: ((__VLS_ctx.uploadError ? 'text-red-500' : 'text-accent')) }, }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("mt-2 text-sm text-foreground") }, });
        if (__VLS_ctx.uploadError) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-red-400") }, });
            (__VLS_ctx.uploadError);
        }
        else {
        }
        if (__VLS_ctx.uploadError) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("mt-1 text-xs text-red-400") }, });
        }
    }
    if (__VLS_ctx.isLocallyStored) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("mt-8") }, });
        // @ts-ignore
        [RateSheetTable,];
        // @ts-ignore
        const __VLS_6 = __VLS_asFunctionalComponent(RateSheetTable, new RateSheetTable({}));
        const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
    }
    if (__VLS_ctx.showPreviewModal) {
        // @ts-ignore
        [PreviewModal2,];
        // @ts-ignore
        const __VLS_11 = __VLS_asFunctionalComponent(PreviewModal2, new PreviewModal2({ ...{ 'onUpdate:mappings': {} }, ...{ 'onUpdate:valid': {} }, ...{ 'onUpdate:startLine': {} }, ...{ 'onConfirm': {} }, ...{ 'onCancel': {} }, showModal: ((__VLS_ctx.showPreviewModal)), columns: ((__VLS_ctx.columns)), previewData: ((__VLS_ctx.previewData)), columnOptions: ((__VLS_ctx.RF_COLUMN_ROLE_OPTIONS)), startLine: ((__VLS_ctx.startLine)), validateRequired: ((true)), }));
        const __VLS_12 = __VLS_11({ ...{ 'onUpdate:mappings': {} }, ...{ 'onUpdate:valid': {} }, ...{ 'onUpdate:startLine': {} }, ...{ 'onConfirm': {} }, ...{ 'onCancel': {} }, showModal: ((__VLS_ctx.showPreviewModal)), columns: ((__VLS_ctx.columns)), previewData: ((__VLS_ctx.previewData)), columnOptions: ((__VLS_ctx.RF_COLUMN_ROLE_OPTIONS)), startLine: ((__VLS_ctx.startLine)), validateRequired: ((true)), }, ...__VLS_functionalComponentArgsRest(__VLS_11));
        let __VLS_16;
        const __VLS_17 = {
            'onUpdate:mappings': (__VLS_ctx.handleMappingUpdate)
        };
        const __VLS_18 = {
            'onUpdate:valid': (newValid => (__VLS_ctx.isValid = newValid))
        };
        const __VLS_19 = {
            'onUpdate:startLine': (newStartLine => (__VLS_ctx.startLine = newStartLine))
        };
        const __VLS_20 = {
            onConfirm: (__VLS_ctx.handleModalConfirm)
        };
        const __VLS_21 = {
            onCancel: (__VLS_ctx.handleModalCancel)
        };
        let __VLS_13;
        let __VLS_14;
        var __VLS_15;
    }
    __VLS_styleScopedClasses['min-h-screen'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['p-8'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['mb-8'];
    __VLS_styleScopedClasses['text-sizeXl'];
    __VLS_styleScopedClasses['tracking-wide'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['uppercase'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['bg-gray-800'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['overflow-hidden'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700/50'];
    __VLS_styleScopedClasses['grid'];
    __VLS_styleScopedClasses['grid-cols-1'];
    __VLS_styleScopedClasses['gap-3'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['space-x-2'];
    __VLS_styleScopedClasses['w-3'];
    __VLS_styleScopedClasses['h-3'];
    __VLS_styleScopedClasses['rounded-full'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['text-2xl'];
    __VLS_styleScopedClasses['font-bold'];
    __VLS_styleScopedClasses['mt-6'];
    __VLS_styleScopedClasses['border-2'];
    __VLS_styleScopedClasses['border-dashed'];
    __VLS_styleScopedClasses['border-gray-600'];
    __VLS_styleScopedClasses['p-8'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['relative'];
    __VLS_styleScopedClasses['absolute'];
    __VLS_styleScopedClasses['inset-0'];
    __VLS_styleScopedClasses['h-full'];
    __VLS_styleScopedClasses['opacity-0'];
    __VLS_styleScopedClasses['cursor-pointer'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['w-6'];
    __VLS_styleScopedClasses['h-6'];
    __VLS_styleScopedClasses['mx-auto'];
    __VLS_styleScopedClasses['mt-2'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['text-red-400'];
    __VLS_styleScopedClasses['mt-1'];
    __VLS_styleScopedClasses['text-xs'];
    __VLS_styleScopedClasses['text-red-400'];
    __VLS_styleScopedClasses['mt-8'];
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
            RateSheetTable: RateSheetTable,
            PreviewModal2: PreviewModal2,
            RF_COLUMN_ROLE_OPTIONS: RF_COLUMN_ROLE_OPTIONS,
            store: store,
            isLocallyStored: isLocallyStored,
            isDragging: isDragging,
            isProcessing: isProcessing,
            uploadError: uploadError,
            rfUploadStatus: rfUploadStatus,
            isRFUploading: isRFUploading,
            showPreviewModal: showPreviewModal,
            previewData: previewData,
            columns: columns,
            startLine: startLine,
            isValid: isValid,
            handleFileChange: handleFileChange,
            handleRfFileDrop: handleRfFileDrop,
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
