import { ref, computed, onMounted } from 'vue';
import { useLergStore } from '@/stores/lerg-store';
import { lergApiService } from '@/services/lerg-api.service';
import { ChevronDownIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/vue/24/outline';
import { getCountryName } from '@/types/country-codes';
import { getStateName } from '@/types/state-codes';
import { LERG_COLUMN_ROLE_OPTIONS } from '@/types/lerg-types';
import PreviewModal2 from '@/components/shared/PreviewModal2.vue';
import Papa from 'papaparse';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const store = useLergStore();
const lergFileInput = ref();
const lergStats = computed(() => store.stats);
const expandedCountries = ref([]);
const showStateDetails = ref(false);
const expandedStates = ref([]);
const expandedProvinces = ref([]);
const showCountryDetails = ref(false);
const isLergLocallyStored = computed(() => {
    return store.isLocallyStored;
});
const isDragging = ref(false);
const lergUploadStatus = ref(null);
const isLergUploading = ref(false);
const dbStatus = ref({
    connected: false,
    error: '',
});
// Preview state
const showPreviewModal = ref(false);
const columns = ref([]);
const previewData = ref([]);
const columnRoles = ref([]);
const startLine = ref(0);
const isModalValid = ref(false);
const columnMappings = ref({});
const selectedFile = ref(null);
async function checkConnection() {
    try {
        await lergApiService.testConnection();
        dbStatus.value = {
            connected: true,
            error: '',
        };
    }
    catch (error) {
        dbStatus.value = {
            connected: false,
            error: error instanceof Error ? error.message : 'Connection failed',
        };
    }
}
onMounted(async () => {
    await checkConnection();
    console.log('Initializing LERG service...');
    await lergApiService.initialize();
});
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}
function formatDate(date) {
    if (!date)
        return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
async function handleLergFileChange(event) {
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
async function handleModalConfirm(mappings) {
    console.log('Modal confirmed with mappings:', mappings);
    showPreviewModal.value = false;
    columnMappings.value = mappings;
    // Continue with file upload using mapped columns
    const file = selectedFile.value;
    console.log('File to upload:', file);
    if (!file)
        return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mappings', JSON.stringify(columnMappings.value));
    formData.append('startLine', startLine.value.toString());
    console.log('FormData contents:', {
        file: formData.get('file'),
        mappings: formData.get('mappings'),
        startLine: formData.get('startLine'),
    });
    try {
        isLergUploading.value = true;
        lergUploadStatus.value = { type: 'success', message: 'Uploading LERG file...' };
        console.log('About to call lergApiService.uploadLergFile');
        await lergApiService.uploadLergFile(formData);
        lergUploadStatus.value = { type: 'success', message: 'LERG file uploaded successfully' };
        // Clear the selected file after successful upload
        selectedFile.value = null;
        if (lergFileInput.value) {
            lergFileInput.value.value = '';
        }
    }
    catch (error) {
        console.error('Failed to upload LERG file:', error);
        lergUploadStatus.value = {
            type: 'error',
            message: 'Error uploading - please reload page and try again',
        };
    }
    finally {
        isLergUploading.value = false;
    }
}
function handleModalCancel() {
    showPreviewModal.value = false;
    if (lergFileInput.value) {
        lergFileInput.value.value = '';
    }
}
async function confirmClearLergData() {
    if (!confirm('Are you sure you want to clear all LERG codes? This action cannot be undone.')) {
        return;
    }
    try {
        await fetch('/api/admin/lerg/clear/lerg', { method: 'DELETE' });
        console.log('LERG codes cleared successfully');
    }
    catch (error) {
        console.error('Failed to clear LERG data:', error);
    }
}
async function handleLergFileDrop(event) {
    event.preventDefault();
    isDragging.value = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
        await handleLergFileChange({ target: { files: [file] } });
    }
}
function toggleExpandState(stateCode) {
    const index = expandedStates.value.indexOf(stateCode);
    if (index === -1) {
        expandedStates.value.push(stateCode);
    }
    else {
        expandedStates.value.splice(index, 1);
    }
}
function toggleStateDetails() {
    showStateDetails.value = !showStateDetails.value;
}
function toggleCountryDetails() {
    showCountryDetails.value = !showCountryDetails.value;
}
function toggleExpandCountry(countryCode) {
    const index = expandedCountries.value.indexOf(countryCode);
    if (index === -1) {
        expandedCountries.value.push(countryCode);
    }
    else {
        expandedCountries.value.splice(index, 1);
    }
}
function toggleExpandProvince(code) {
    const index = expandedProvinces.value.indexOf(code);
    if (index === -1) {
        expandedProvinces.value.push(code);
    }
    else {
        expandedProvinces.value.splice(index, 1);
    }
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("min-h-screen text-white p-8 w-full") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({ ...{ class: ("text-sizeXl tracking-wide text-accent uppercase mb-8") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex flex-col gap-6 mb-8") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("bg-gray-800 rounded-lg p-6") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("grid grid-cols-1 gap-3 border-b border-gray-700/50 pb-4 mb-6") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({ ...{ class: ("text-gray-400") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-lg") }, });
    (__VLS_ctx.formatDate(__VLS_ctx.lergStats.lastUpdated));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({ ...{ class: ("text-gray-400") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-2xl font-bold") }, });
    (__VLS_ctx.formatNumber(__VLS_ctx.lergStats.totalRecords));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({ ...{ class: ("text-gray-400") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-2xl font-bold") }, });
    (__VLS_ctx.store.getCountryCount);
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({ ...{ class: ("text-gray-400") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center space-x-2") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("w-3 h-3 rounded-full") }, ...{ class: ((__VLS_ctx.dbStatus.connected
                ? 'bg-accent animate-status-pulse-success'
                : 'bg-destructive animate-status-pulse-error')) }, });
    if (!__VLS_ctx.dbStatus.connected) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-red-400 text-sm") }, });
        (__VLS_ctx.dbStatus.error);
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({ ...{ class: ("text-gray-400") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center space-x-2") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("w-3 h-3 rounded-full") }, ...{ class: (([
                __VLS_ctx.isLergLocallyStored
                    ? 'bg-accent animate-status-pulse-success'
                    : 'bg-destructive animate-status-pulse-error',
            ])) }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("space-y-6") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("bg-gray-900/30 rounded-lg overflow-hidden") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onClick: (__VLS_ctx.toggleStateDetails) }, ...{ class: ("p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("font-medium") }, });
    const __VLS_0 = __VLS_resolvedLocalAndGlobalComponents.ChevronDownIcon;
    /** @type { [typeof __VLS_components.ChevronDownIcon, ] } */
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({ ...{ class: (({ 'transform rotate-180': __VLS_ctx.showStateDetails })) }, ...{ class: ("w-4 h-4 transition-transform") }, }));
    const __VLS_2 = __VLS_1({ ...{ class: (({ 'transform rotate-180': __VLS_ctx.showStateDetails })) }, ...{ class: ("w-4 h-4 transition-transform") }, }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    if (__VLS_ctx.showStateDetails) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("p-4 space-y-4") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("space-y-2") }, });
        for (const [state] of __VLS_getVForSourceType((__VLS_ctx.store.sortedStatesWithNPAs.filter(s => s.npas.length > 1)))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onClick: (...[$event]) => {
                        if (!((__VLS_ctx.showStateDetails)))
                            return;
                        __VLS_ctx.toggleExpandState(state.code);
                    } }, key: ((state.code)), ...{ class: ("bg-gray-900/80 p-4 rounded-lg w-full hover:bg-gray-600/40 transition-colors cursor-pointer") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("font-medium") }, });
            (__VLS_ctx.getStateName(state.code, 'US'));
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center space-x-4") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center space-x-2 px-2 py-1 rounded") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-sm text-gray-400") }, });
            (state.npas.length);
            const __VLS_6 = __VLS_resolvedLocalAndGlobalComponents.ChevronDownIcon;
            /** @type { [typeof __VLS_components.ChevronDownIcon, ] } */
            // @ts-ignore
            const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({ ...{ class: (({ 'transform rotate-180': __VLS_ctx.expandedStates.includes(state.code) })) }, ...{ class: ("w-4 h-4 transition-transform") }, }));
            const __VLS_8 = __VLS_7({ ...{ class: (({ 'transform rotate-180': __VLS_ctx.expandedStates.includes(state.code) })) }, ...{ class: ("w-4 h-4 transition-transform") }, }, ...__VLS_functionalComponentArgsRest(__VLS_7));
            if (__VLS_ctx.expandedStates.includes(state.code)) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("mt-3 pl-4") }, });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex flex-wrap gap-2") }, });
                for (const [npa] of __VLS_getVForSourceType((state.npas))) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ key: ((npa)), ...{ class: ("text-gray-300 bg-gray-800/50 px-3 py-1 rounded") }, });
                    (npa);
                }
            }
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4") }, });
        for (const [state] of __VLS_getVForSourceType((__VLS_ctx.store.sortedStatesWithNPAs.filter(s => s.npas.length === 1)))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ key: ((state.code)), ...{ class: ("bg-gray-900/50 p-4 rounded-lg") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("font-medium") }, });
            (__VLS_ctx.getStateName(state.code, 'US'));
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-gray-300") }, });
            (state.npas[0]);
        }
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("bg-gray-900/30 rounded-lg overflow-hidden") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onClick: (__VLS_ctx.toggleCountryDetails) }, ...{ class: ("p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("font-medium") }, });
    const __VLS_12 = __VLS_resolvedLocalAndGlobalComponents.ChevronDownIcon;
    /** @type { [typeof __VLS_components.ChevronDownIcon, ] } */
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({ ...{ class: (({ 'transform rotate-180': __VLS_ctx.showCountryDetails })) }, ...{ class: ("w-4 h-4 transition-transform") }, }));
    const __VLS_14 = __VLS_13({ ...{ class: (({ 'transform rotate-180': __VLS_ctx.showCountryDetails })) }, ...{ class: ("w-4 h-4 transition-transform") }, }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    if (__VLS_ctx.showCountryDetails) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("p-4 space-y-4") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("space-y-2") }, });
        for (const [country] of __VLS_getVForSourceType((__VLS_ctx.store.getCountryData.filter(c => c.country !== 'US' && !(c.country === 'CA' && !c.provinces) && c.npaCount > 1)))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onClick: (...[$event]) => {
                        if (!((__VLS_ctx.showCountryDetails)))
                            return;
                        __VLS_ctx.toggleExpandCountry(country.country);
                    } }, key: ((country.country)), ...{ class: ("bg-gray-900/80 p-4 rounded-lg w-full hover:bg-gray-600/40 transition-colors cursor-pointer") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("font-medium") }, });
            (__VLS_ctx.getCountryName(country.country));
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center space-x-4") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center space-x-2 px-2 py-1 rounded") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-sm text-gray-400") }, });
            (country.npaCount);
            const __VLS_18 = __VLS_resolvedLocalAndGlobalComponents.ChevronDownIcon;
            /** @type { [typeof __VLS_components.ChevronDownIcon, ] } */
            // @ts-ignore
            const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({ ...{ class: (({ 'transform rotate-180': __VLS_ctx.expandedCountries.includes(country.country) })) }, ...{ class: ("w-4 h-4 transition-transform") }, }));
            const __VLS_20 = __VLS_19({ ...{ class: (({ 'transform rotate-180': __VLS_ctx.expandedCountries.includes(country.country) })) }, ...{ class: ("w-4 h-4 transition-transform") }, }, ...__VLS_functionalComponentArgsRest(__VLS_19));
            if (__VLS_ctx.expandedCountries.includes(country.country)) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("mt-3 pl-4") }, });
                if (country.country === 'CA') {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("space-y-3") }, });
                    for (const [province] of __VLS_getVForSourceType((country.provinces?.filter(p => p.npas.length > 1)))) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onClick: (...[$event]) => {
                                    if (!((__VLS_ctx.showCountryDetails)))
                                        return;
                                    if (!((__VLS_ctx.expandedCountries.includes(country.country))))
                                        return;
                                    if (!((country.country === 'CA')))
                                        return;
                                    __VLS_ctx.toggleExpandProvince(province.code);
                                } }, key: ((province.code)), ...{ class: ("bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-600/40 transition-colors") }, });
                        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center") }, });
                        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("font-medium") }, });
                        (__VLS_ctx.getStateName(province.code, 'CA'));
                        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center space-x-2") }, });
                        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-sm text-gray-400") }, });
                        (province.npas.length);
                        const __VLS_24 = __VLS_resolvedLocalAndGlobalComponents.ChevronDownIcon;
                        /** @type { [typeof __VLS_components.ChevronDownIcon, ] } */
                        // @ts-ignore
                        const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({ ...{ class: (({ 'transform rotate-180': __VLS_ctx.expandedProvinces.includes(province.code) })) }, ...{ class: ("w-4 h-4 transition-transform") }, }));
                        const __VLS_26 = __VLS_25({ ...{ class: (({ 'transform rotate-180': __VLS_ctx.expandedProvinces.includes(province.code) })) }, ...{ class: ("w-4 h-4 transition-transform") }, }, ...__VLS_functionalComponentArgsRest(__VLS_25));
                        if (__VLS_ctx.expandedProvinces.includes(province.code)) {
                            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("mt-3") }, });
                            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex flex-wrap gap-2") }, });
                            for (const [npa] of __VLS_getVForSourceType((province.npas))) {
                                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ key: ((npa)), ...{ class: ("text-gray-300 bg-gray-700/50 px-3 py-1 rounded") }, });
                                (npa);
                            }
                        }
                    }
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4") }, });
                    for (const [province] of __VLS_getVForSourceType((country.provinces?.filter(p => p.npas.length === 1)))) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ key: ((province.code)), ...{ class: ("bg-gray-800/50 p-4 rounded-lg") }, });
                        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center") }, });
                        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("font-medium") }, });
                        (__VLS_ctx.getStateName(province.code, 'CA'));
                        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-gray-300") }, });
                        (province.npas[0]);
                    }
                }
                else {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex flex-wrap gap-2") }, });
                    for (const [npa] of __VLS_getVForSourceType((country.npas))) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ key: ((npa)), ...{ class: ("text-gray-300 bg-gray-800/50 px-3 py-1 rounded") }, });
                        (npa);
                    }
                }
            }
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4") }, });
        for (const [country] of __VLS_getVForSourceType((__VLS_ctx.store.getCountryData.filter(c => c.country !== 'US' && !(c.country === 'CA' && !c.provinces) && c.npaCount === 1)))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ key: ((country.country)), ...{ class: ("bg-gray-900/50 p-4 rounded-lg") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("font-medium") }, });
            (__VLS_ctx.getCountryName(country.country));
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-gray-300") }, });
            (country.npas[0]);
        }
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("grid grid-cols-1 gap-6 mb-8") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("bg-gray-800 rounded-lg p-6") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({ ...{ class: ("text-xl font-semibold mb-4") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onDragover: () => { } }, ...{ onDrop: (__VLS_ctx.handleLergFileDrop) }, ...{ class: ("border-2 border-dashed border-gray-600 rounded-lg p-8 text-center relative") }, ...{ class: (([
                __VLS_ctx.isDragging ? 'border-green-500' : '',
                __VLS_ctx.lergUploadStatus?.type === 'error' ? 'border-red-500' : '',
                __VLS_ctx.isLergUploading ? 'border-blue-500' : '',
            ])) }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ ...{ onChange: (__VLS_ctx.handleLergFileChange) }, type: ("file"), ref: ("lergFileInput"), ...{ class: ("hidden") }, accept: (".csv"), });
    // @ts-ignore navigation for `const lergFileInput = ref()`
    __VLS_ctx.lergFileInput;
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                $refs.lergFileInput.click();
            } }, disabled: ((__VLS_ctx.isLergUploading)), ...{ class: ("px-6 py-2 bg-accent/20 border border-accent/50 hover:bg-accent/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:border disabled:border-gray-700") }, ...{ class: (({ 'animate-upload-pulse': __VLS_ctx.isLergUploading })) }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center justify-center space-x-2") }, });
    const __VLS_30 = __VLS_resolvedLocalAndGlobalComponents.ArrowUpTrayIcon;
    /** @type { [typeof __VLS_components.ArrowUpTrayIcon, ] } */
    // @ts-ignore
    const __VLS_31 = __VLS_asFunctionalComponent(__VLS_30, new __VLS_30({ ...{ class: ("w-4 h-4 text-accent") }, }));
    const __VLS_32 = __VLS_31({ ...{ class: ("w-4 h-4 text-accent") }, }, ...__VLS_functionalComponentArgsRest(__VLS_31));
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-sm text-accent") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-xs text-gray-500 mt-1") }, });
    if (__VLS_ctx.lergUploadStatus) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("mt-4 text-center") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ((['text-sm', __VLS_ctx.lergUploadStatus.type === 'error' ? 'text-red-400' : 'text-green-400'])) }, });
        (__VLS_ctx.lergUploadStatus.message);
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("bg-destructive/10 border border-destructive/50 rounded-lg p-6") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center justify-between") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({ ...{ class: ("text-lg font-medium text-destructive") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.confirmClearLergData) }, ...{ class: ("inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm border border-destructive/50 bg-destructive/20 hover:bg-destructive/30 text-destructive transition-all rounded-md") }, });
    const __VLS_36 = __VLS_resolvedLocalAndGlobalComponents.TrashIcon;
    /** @type { [typeof __VLS_components.TrashIcon, ] } */
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({ ...{ class: ("w-3.5 h-3.5") }, }));
    const __VLS_38 = __VLS_37({ ...{ class: ("w-3.5 h-3.5") }, }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    if (__VLS_ctx.showPreviewModal) {
        // @ts-ignore
        [PreviewModal2,];
        // @ts-ignore
        const __VLS_42 = __VLS_asFunctionalComponent(PreviewModal2, new PreviewModal2({ ...{ 'onUpdate:mappings': {} }, ...{ 'onUpdate:valid': {} }, ...{ 'onUpdate:startLine': {} }, ...{ 'onConfirm': {} }, ...{ 'onCancel': {} }, showModal: ((__VLS_ctx.showPreviewModal)), columns: ((__VLS_ctx.columns)), previewData: ((__VLS_ctx.previewData)), startLine: ((__VLS_ctx.startLine)), columnOptions: ((__VLS_ctx.LERG_COLUMN_ROLE_OPTIONS)), }));
        const __VLS_43 = __VLS_42({ ...{ 'onUpdate:mappings': {} }, ...{ 'onUpdate:valid': {} }, ...{ 'onUpdate:startLine': {} }, ...{ 'onConfirm': {} }, ...{ 'onCancel': {} }, showModal: ((__VLS_ctx.showPreviewModal)), columns: ((__VLS_ctx.columns)), previewData: ((__VLS_ctx.previewData)), startLine: ((__VLS_ctx.startLine)), columnOptions: ((__VLS_ctx.LERG_COLUMN_ROLE_OPTIONS)), }, ...__VLS_functionalComponentArgsRest(__VLS_42));
        let __VLS_47;
        const __VLS_48 = {
            'onUpdate:mappings': (__VLS_ctx.handleMappingUpdate)
        };
        const __VLS_49 = {
            'onUpdate:valid': (isValid => (__VLS_ctx.isModalValid = isValid))
        };
        const __VLS_50 = {
            'onUpdate:startLine': (newStartLine => (__VLS_ctx.startLine = newStartLine))
        };
        const __VLS_51 = {
            onConfirm: (__VLS_ctx.handleModalConfirm)
        };
        const __VLS_52 = {
            onCancel: (__VLS_ctx.handleModalCancel)
        };
        let __VLS_44;
        let __VLS_45;
        var __VLS_46;
    }
    __VLS_styleScopedClasses['min-h-screen'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['p-8'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['text-sizeXl'];
    __VLS_styleScopedClasses['tracking-wide'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['uppercase'];
    __VLS_styleScopedClasses['mb-8'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['flex-col'];
    __VLS_styleScopedClasses['gap-6'];
    __VLS_styleScopedClasses['mb-8'];
    __VLS_styleScopedClasses['bg-gray-800'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['grid'];
    __VLS_styleScopedClasses['grid-cols-1'];
    __VLS_styleScopedClasses['gap-3'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700/50'];
    __VLS_styleScopedClasses['pb-4'];
    __VLS_styleScopedClasses['mb-6'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['text-lg'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['text-2xl'];
    __VLS_styleScopedClasses['font-bold'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['text-2xl'];
    __VLS_styleScopedClasses['font-bold'];
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
    __VLS_styleScopedClasses['text-red-400'];
    __VLS_styleScopedClasses['text-sm'];
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
    __VLS_styleScopedClasses['space-y-6'];
    __VLS_styleScopedClasses['bg-gray-900/30'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['overflow-hidden'];
    __VLS_styleScopedClasses['p-4'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['hover:bg-gray-600/40'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['cursor-pointer'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['transform'];
    __VLS_styleScopedClasses['rotate-180'];
    __VLS_styleScopedClasses['w-4'];
    __VLS_styleScopedClasses['h-4'];
    __VLS_styleScopedClasses['transition-transform'];
    __VLS_styleScopedClasses['p-4'];
    __VLS_styleScopedClasses['space-y-4'];
    __VLS_styleScopedClasses['space-y-2'];
    __VLS_styleScopedClasses['bg-gray-900/80'];
    __VLS_styleScopedClasses['p-4'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['hover:bg-gray-600/40'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['cursor-pointer'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['space-x-4'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['space-x-2'];
    __VLS_styleScopedClasses['px-2'];
    __VLS_styleScopedClasses['py-1'];
    __VLS_styleScopedClasses['rounded'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['transform'];
    __VLS_styleScopedClasses['rotate-180'];
    __VLS_styleScopedClasses['w-4'];
    __VLS_styleScopedClasses['h-4'];
    __VLS_styleScopedClasses['transition-transform'];
    __VLS_styleScopedClasses['mt-3'];
    __VLS_styleScopedClasses['pl-4'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['flex-wrap'];
    __VLS_styleScopedClasses['gap-2'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['bg-gray-800/50'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-1'];
    __VLS_styleScopedClasses['rounded'];
    __VLS_styleScopedClasses['grid'];
    __VLS_styleScopedClasses['grid-cols-1'];
    __VLS_styleScopedClasses['md:grid-cols-2'];
    __VLS_styleScopedClasses['lg:grid-cols-3'];
    __VLS_styleScopedClasses['gap-4'];
    __VLS_styleScopedClasses['bg-gray-900/50'];
    __VLS_styleScopedClasses['p-4'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['bg-gray-900/30'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['overflow-hidden'];
    __VLS_styleScopedClasses['p-4'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['hover:bg-gray-600/40'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['cursor-pointer'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['transform'];
    __VLS_styleScopedClasses['rotate-180'];
    __VLS_styleScopedClasses['w-4'];
    __VLS_styleScopedClasses['h-4'];
    __VLS_styleScopedClasses['transition-transform'];
    __VLS_styleScopedClasses['p-4'];
    __VLS_styleScopedClasses['space-y-4'];
    __VLS_styleScopedClasses['space-y-2'];
    __VLS_styleScopedClasses['bg-gray-900/80'];
    __VLS_styleScopedClasses['p-4'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['hover:bg-gray-600/40'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['cursor-pointer'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['space-x-4'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['space-x-2'];
    __VLS_styleScopedClasses['px-2'];
    __VLS_styleScopedClasses['py-1'];
    __VLS_styleScopedClasses['rounded'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['transform'];
    __VLS_styleScopedClasses['rotate-180'];
    __VLS_styleScopedClasses['w-4'];
    __VLS_styleScopedClasses['h-4'];
    __VLS_styleScopedClasses['transition-transform'];
    __VLS_styleScopedClasses['mt-3'];
    __VLS_styleScopedClasses['pl-4'];
    __VLS_styleScopedClasses['space-y-3'];
    __VLS_styleScopedClasses['bg-gray-800/50'];
    __VLS_styleScopedClasses['p-4'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['cursor-pointer'];
    __VLS_styleScopedClasses['hover:bg-gray-600/40'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['space-x-2'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['transform'];
    __VLS_styleScopedClasses['rotate-180'];
    __VLS_styleScopedClasses['w-4'];
    __VLS_styleScopedClasses['h-4'];
    __VLS_styleScopedClasses['transition-transform'];
    __VLS_styleScopedClasses['mt-3'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['flex-wrap'];
    __VLS_styleScopedClasses['gap-2'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['bg-gray-700/50'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-1'];
    __VLS_styleScopedClasses['rounded'];
    __VLS_styleScopedClasses['grid'];
    __VLS_styleScopedClasses['grid-cols-1'];
    __VLS_styleScopedClasses['md:grid-cols-2'];
    __VLS_styleScopedClasses['lg:grid-cols-3'];
    __VLS_styleScopedClasses['gap-4'];
    __VLS_styleScopedClasses['bg-gray-800/50'];
    __VLS_styleScopedClasses['p-4'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['flex-wrap'];
    __VLS_styleScopedClasses['gap-2'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['bg-gray-800/50'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-1'];
    __VLS_styleScopedClasses['rounded'];
    __VLS_styleScopedClasses['grid'];
    __VLS_styleScopedClasses['grid-cols-1'];
    __VLS_styleScopedClasses['md:grid-cols-2'];
    __VLS_styleScopedClasses['lg:grid-cols-3'];
    __VLS_styleScopedClasses['gap-4'];
    __VLS_styleScopedClasses['bg-gray-900/50'];
    __VLS_styleScopedClasses['p-4'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['grid'];
    __VLS_styleScopedClasses['grid-cols-1'];
    __VLS_styleScopedClasses['gap-6'];
    __VLS_styleScopedClasses['mb-8'];
    __VLS_styleScopedClasses['bg-gray-800'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['text-xl'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['border-2'];
    __VLS_styleScopedClasses['border-dashed'];
    __VLS_styleScopedClasses['border-gray-600'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['p-8'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['relative'];
    __VLS_styleScopedClasses['hidden'];
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
    __VLS_styleScopedClasses['animate-upload-pulse'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['space-x-2'];
    __VLS_styleScopedClasses['w-4'];
    __VLS_styleScopedClasses['h-4'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['text-xs'];
    __VLS_styleScopedClasses['text-gray-500'];
    __VLS_styleScopedClasses['mt-1'];
    __VLS_styleScopedClasses['mt-4'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['bg-destructive/10'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-destructive/50'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['text-lg'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-destructive'];
    __VLS_styleScopedClasses['inline-flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['gap-1.5'];
    __VLS_styleScopedClasses['px-2.5'];
    __VLS_styleScopedClasses['py-1.5'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-destructive/50'];
    __VLS_styleScopedClasses['bg-destructive/20'];
    __VLS_styleScopedClasses['hover:bg-destructive/30'];
    __VLS_styleScopedClasses['text-destructive'];
    __VLS_styleScopedClasses['transition-all'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['w-3.5'];
    __VLS_styleScopedClasses['h-3.5'];
    var __VLS_slots;
    var __VLS_inheritedAttrs;
    const __VLS_refs = {
        "lergFileInput": __VLS_nativeElements['input'],
    };
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
            ChevronDownIcon: ChevronDownIcon,
            TrashIcon: TrashIcon,
            ArrowUpTrayIcon: ArrowUpTrayIcon,
            getCountryName: getCountryName,
            getStateName: getStateName,
            LERG_COLUMN_ROLE_OPTIONS: LERG_COLUMN_ROLE_OPTIONS,
            PreviewModal2: PreviewModal2,
            store: store,
            lergFileInput: lergFileInput,
            lergStats: lergStats,
            expandedCountries: expandedCountries,
            showStateDetails: showStateDetails,
            expandedStates: expandedStates,
            expandedProvinces: expandedProvinces,
            showCountryDetails: showCountryDetails,
            isLergLocallyStored: isLergLocallyStored,
            isDragging: isDragging,
            lergUploadStatus: lergUploadStatus,
            isLergUploading: isLergUploading,
            dbStatus: dbStatus,
            showPreviewModal: showPreviewModal,
            columns: columns,
            previewData: previewData,
            startLine: startLine,
            isModalValid: isModalValid,
            formatNumber: formatNumber,
            formatDate: formatDate,
            handleLergFileChange: handleLergFileChange,
            handleModalConfirm: handleModalConfirm,
            handleModalCancel: handleModalCancel,
            confirmClearLergData: confirmClearLergData,
            handleLergFileDrop: handleLergFileDrop,
            toggleExpandState: toggleExpandState,
            toggleStateDetails: toggleStateDetails,
            toggleCountryDetails: toggleCountryDetails,
            toggleExpandCountry: toggleExpandCountry,
            toggleExpandProvince: toggleExpandProvince,
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
