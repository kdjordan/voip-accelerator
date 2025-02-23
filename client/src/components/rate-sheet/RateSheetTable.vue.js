import { ref, computed, nextTick } from 'vue';
import { ChevronRightIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline';
import { useRateSheetStore } from '@/stores/rate-sheet-store';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const store = useRateSheetStore();
const groupedData = computed(() => store.getGroupedData);
const expandedRows = ref([]);
const filterStatus = ref('all');
const searchQuery = ref('');
const selectedRates = ref({});
const customRates = ref({});
const originalRates = ref({});
const customRateModal = ref({
    isOpen: false,
    destinationName: '',
    value: '',
});
const customRateInput = ref(null);
// Add new refs for processing state
const isBulkProcessing = ref(false);
const processedCount = ref(0);
const totalToProcess = ref(0);
const filteredData = computed(() => {
    let filtered = groupedData.value;
    // Apply status filter
    if (filterStatus.value === 'conflicts') {
        filtered = filtered.filter(group => group.hasDiscrepancy);
    }
    else if (filterStatus.value === 'no-conflicts') {
        filtered = filtered.filter(group => !group.hasDiscrepancy);
    }
    // Apply search filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(group => group.destinationName.toLowerCase().includes(query));
    }
    return filtered;
});
function toggleExpand(destinationName) {
    const index = expandedRows.value.indexOf(destinationName);
    if (index > -1) {
        expandedRows.value.splice(index, 1);
    }
    else {
        expandedRows.value.push(destinationName);
    }
}
function formatRate(rate) {
    return rate.toFixed(6);
}
function isSelectedRate(destinationName, rate) {
    return selectedRates.value[destinationName] === rate;
}
function isCustomRate(destinationName) {
    return selectedRates.value[destinationName] === customRates.value[destinationName];
}
function selectRate(destinationName, rate) {
    selectedRates.value[destinationName] = rate;
}
function enableCustomRate(destinationName) {
    if (!customRates.value[destinationName]) {
        customRates.value[destinationName] = 0;
    }
    selectedRates.value[destinationName] = customRates.value[destinationName];
}
function handleCustomRateInput(destinationName, event) {
    const value = parseFloat(event.target.value);
    if (!isNaN(value)) {
        customRates.value[destinationName] = value;
        selectedRates.value[destinationName] = value;
    }
}
function hasUnsavedChanges(destinationName) {
    return selectedRates.value[destinationName] !== originalRates.value[destinationName];
}
async function saveRateSelection(group) {
    const newRate = selectedRates.value[group.destinationName];
    if (newRate !== undefined) {
        await store.updateDestinationRate(group.destinationName, newRate);
        originalRates.value[group.destinationName] = newRate;
        store.setGroupedData(store.getGroupedData);
        const index = expandedRows.value.indexOf(group.destinationName);
        if (index > -1) {
            expandedRows.value.splice(index, 1);
        }
    }
}
function openCustomRateInput(destinationName) {
    customRateModal.value = {
        isOpen: true,
        destinationName,
        value: customRates.value[destinationName]?.toString() || '',
    };
    nextTick(() => {
        customRateInput.value?.focus();
    });
}
function saveCustomRate() {
    const value = parseFloat(customRateModal.value.value);
    if (!isNaN(value)) {
        const { destinationName } = customRateModal.value;
        customRates.value[destinationName] = value;
        selectedRates.value[destinationName] = value;
        customRateModal.value.isOpen = false;
    }
}
async function handleBulkUpdate(mode) {
    isBulkProcessing.value = true;
    processedCount.value = 0;
    // Get all destinations with discrepancies
    const destinationsToFix = groupedData.value.filter(group => group.hasDiscrepancy);
    totalToProcess.value = destinationsToFix.length;
    try {
        // Process in chunks to allow UI updates
        for (let i = 0; i < destinationsToFix.length; i++) {
            const group = destinationsToFix[i];
            const rates = group.rates.map(r => r.rate);
            const newRate = mode === 'highest' ? Math.max(...rates) : Math.min(...rates);
            await store.updateDestinationRate(group.destinationName, newRate);
            processedCount.value++;
            // Allow UI to update
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        // Force a final update of the grouped data
        store.setGroupedData(store.getGroupedData);
    }
    finally {
        isBulkProcessing.value = false;
        processedCount.value = 0;
        totalToProcess.value = 0;
    }
}
function handleClearData() {
    if (confirm('Are you sure you want to clear all rate sheet data?')) {
        store.clearData();
    }
}
function handleExport() {
    // Convert data to CSV format
    const headers = ['name', 'prefix', 'rate', 'effective', 'min duration', 'increments'];
    const rows = store.originalData.map(record => [
        record.name,
        record.prefix,
        record.rate.toFixed(6),
        record.effective,
        record.minDuration,
        record.increments,
    ]);
    // Create CSV content
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'rate_sheet_formalized.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("space-y-4") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("bg-gray-800 rounded-lg p-4 mb-4") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center justify-between mb-4") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center gap-4") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({ ...{ class: ("text-sm font-medium text-gray-300") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-sm text-gray-400") }, });
    (__VLS_ctx.filteredData.length);
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center gap-2") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.handleClearData) }, ...{ class: ("inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-md text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 transition-colors") }, });
    const __VLS_0 = __VLS_resolvedLocalAndGlobalComponents.TrashIcon;
    /** @type { [typeof __VLS_components.TrashIcon, ] } */
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({ ...{ class: ("w-4 h-4") }, }));
    const __VLS_2 = __VLS_1({ ...{ class: ("w-4 h-4") }, }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("grid grid-cols-3 gap-4") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({ ...{ class: ("block text-sm text-gray-400 mb-1") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({ value: ((__VLS_ctx.filterStatus)), ...{ class: ("w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({ value: ("all"), });
    __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({ value: ("conflicts"), });
    __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({ value: ("no-conflicts"), });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({ ...{ class: ("block text-sm text-gray-400 mb-1") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ value: ((__VLS_ctx.searchQuery)), type: ("text"), placeholder: ("Search destinations..."), ...{ class: ("w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    if (__VLS_ctx.store.getDiscrepancyCount > 0) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({ ...{ class: ("block text-sm text-gray-400 mb-1") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("space-y-2") }, });
        if (__VLS_ctx.isBulkProcessing) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("w-full bg-gray-700 rounded-full h-2") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("bg-accent h-2 rounded-full transition-all duration-200") }, ...{ style: (({ width: `${(__VLS_ctx.processedCount / __VLS_ctx.totalToProcess) * 100}%` })) }, });
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex gap-2") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.store.getDiscrepancyCount > 0)))
                        return;
                    __VLS_ctx.handleBulkUpdate('highest');
                } }, disabled: ((__VLS_ctx.isBulkProcessing)), ...{ class: ("flex-1 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300") }, ...{ class: (({ 'opacity-50 cursor-not-allowed': __VLS_ctx.isBulkProcessing })) }, });
        (__VLS_ctx.isBulkProcessing ? `Processing ${__VLS_ctx.processedCount}/${__VLS_ctx.totalToProcess}...` : 'Use Highest');
        if (!__VLS_ctx.isBulkProcessing) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                        if (!((__VLS_ctx.store.getDiscrepancyCount > 0)))
                            return;
                        if (!((!__VLS_ctx.isBulkProcessing)))
                            return;
                        __VLS_ctx.handleBulkUpdate('lowest');
                    } }, ...{ class: ("flex-1 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300") }, });
        }
    }
    else if (!__VLS_ctx.isBulkProcessing && __VLS_ctx.store.getDiscrepancyCount === 0) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({ ...{ class: ("block text-sm text-gray-400 mb-1") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.handleExport) }, ...{ class: ("w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium rounded-md text-green-400 hover:text-green-300 bg-green-400/10 hover:bg-green-400/20 transition-colors") }, });
        const __VLS_6 = __VLS_resolvedLocalAndGlobalComponents.ArrowDownTrayIcon;
        /** @type { [typeof __VLS_components.ArrowDownTrayIcon, ] } */
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({ ...{ class: ("w-4 h-4") }, }));
        const __VLS_8 = __VLS_7({ ...{ class: ("w-4 h-4") }, }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    }
    if (__VLS_ctx.filteredData.length > 0) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("overflow-hidden rounded-lg bg-gray-800 shadow") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({ ...{ class: ("min-w-full divide-y divide-gray-700") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({ ...{ class: ("bg-gray-900/50") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ scope: ("col"), ...{ class: ("w-8 px-3 py-3") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ scope: ("col"), ...{ class: ("px-3 py-3 text-left text-sm font-semibold text-gray-300") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ scope: ("col"), ...{ class: ("px-3 py-3 text-left text-sm font-semibold text-gray-300") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ scope: ("col"), ...{ class: ("px-3 py-3 text-left text-sm font-semibold text-gray-300") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ scope: ("col"), ...{ class: ("px-3 py-3 text-left text-sm font-semibold text-gray-300") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ scope: ("col"), ...{ class: ("px-3 py-3 text-left text-sm font-semibold text-gray-300") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ scope: ("col"), ...{ class: ("px-3 py-3 text-left text-sm font-semibold text-gray-300") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({ ...{ class: ("divide-y divide-gray-800") }, });
        for (const [group] of __VLS_getVForSourceType((__VLS_ctx.filteredData))) {
            (group.destinationName);
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ ...{ onClick: (...[$event]) => {
                        if (!((__VLS_ctx.filteredData.length > 0)))
                            return;
                        __VLS_ctx.toggleExpand(group.destinationName);
                    } }, ...{ class: ("hover:bg-gray-700/50 cursor-pointer") }, ...{ class: (({ 'bg-red-900/10': group.hasDiscrepancy })) }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("px-3 py-4") }, });
            const __VLS_12 = __VLS_resolvedLocalAndGlobalComponents.ChevronRightIcon;
            /** @type { [typeof __VLS_components.ChevronRightIcon, ] } */
            // @ts-ignore
            const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({ ...{ class: ("h-5 w-5 text-gray-400 transition-transform") }, ...{ class: (({ 'rotate-90': __VLS_ctx.expandedRows.includes(group.destinationName) })) }, }));
            const __VLS_14 = __VLS_13({ ...{ class: ("h-5 w-5 text-gray-400 transition-transform") }, ...{ class: (({ 'rotate-90': __VLS_ctx.expandedRows.includes(group.destinationName) })) }, }, ...__VLS_functionalComponentArgsRest(__VLS_13));
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("px-3 py-4 text-sm") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("font-medium text-white") }, });
            (group.destinationName);
            if (group.hasDiscrepancy) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("ml-2 inline-flex items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20") }, });
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("px-3 py-4 text-sm text-gray-300") }, });
            (group.codes.length);
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("px-3 py-4 text-sm text-gray-300") }, });
            if (!group.hasDiscrepancy) {
                (__VLS_ctx.formatRate(group.rates[0].rate));
            }
            else {
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("px-3 py-4 text-sm text-gray-300") }, });
            (group.effectiveDate);
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("px-3 py-4 text-sm text-gray-300") }, });
            (group.minDuration);
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("px-3 py-4 text-sm text-gray-300") }, });
            (group.increments);
            if (__VLS_ctx.expandedRows.includes(group.destinationName)) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ colspan: ("7"), ...{ class: ("px-3 py-4 bg-gray-900/30") }, });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("pl-8") }, });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center justify-between mb-4") }, });
                __VLS_elementAsFunction(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({ ...{ class: ("text-sm font-medium text-gray-300") }, });
                if (__VLS_ctx.hasUnsavedChanges(group.destinationName)) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                                if (!((__VLS_ctx.filteredData.length > 0)))
                                    return;
                                if (!((__VLS_ctx.expandedRows.includes(group.destinationName))))
                                    return;
                                if (!((__VLS_ctx.hasUnsavedChanges(group.destinationName))))
                                    return;
                                __VLS_ctx.saveRateSelection(group);
                            } }, ...{ class: ("px-3 py-1 text-sm bg-accent hover:bg-accent-hover text-white rounded-md transition-colors") }, });
                }
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("space-y-2") }, });
                for (const [rate] of __VLS_getVForSourceType((group.rates))) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ key: ((rate.rate)), ...{ class: ("flex items-center justify-between text-sm p-2 rounded-md") }, ...{ class: (({ 'bg-gray-800/50': __VLS_ctx.isSelectedRate(group.destinationName, rate.rate) })) }, });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({ ...{ class: ("flex items-center gap-2 flex-1 cursor-pointer") }, });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ ...{ onChange: (...[$event]) => {
                                if (!((__VLS_ctx.filteredData.length > 0)))
                                    return;
                                if (!((__VLS_ctx.expandedRows.includes(group.destinationName))))
                                    return;
                                __VLS_ctx.selectRate(group.destinationName, rate.rate);
                            } }, type: ("radio"), name: ((`rate-${group.destinationName}`)), value: ((rate.rate)), checked: ((__VLS_ctx.isSelectedRate(group.destinationName, rate.rate))), ...{ class: ("text-accent") }, });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("w-2 h-2 rounded-full") }, ...{ class: ((rate.isCommon ? 'bg-green-500' : 'bg-yellow-500')) }, });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-white") }, });
                    (__VLS_ctx.formatRate(rate.rate));
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-gray-400") }, });
                    (rate.count);
                    (Math.round(rate.percentage));
                }
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onClick: () => { } }, ...{ class: ("flex items-center justify-between text-sm p-2 rounded-md") }, });
                __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({ ...{ class: ("flex items-center gap-2 flex-1 cursor-pointer") }, });
                __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ ...{ onChange: (...[$event]) => {
                            if (!((__VLS_ctx.filteredData.length > 0)))
                                return;
                            if (!((__VLS_ctx.expandedRows.includes(group.destinationName))))
                                return;
                            __VLS_ctx.enableCustomRate(group.destinationName);
                        } }, type: ("radio"), name: ((`rate-${group.destinationName}`)), value: ("custom"), checked: ((__VLS_ctx.isCustomRate(group.destinationName))), ...{ class: ("text-accent") }, });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center gap-2") }, });
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-white") }, });
                if (__VLS_ctx.customRates[group.destinationName]) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-accent") }, });
                    (__VLS_ctx.formatRate(__VLS_ctx.customRates[group.destinationName]));
                }
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                            if (!((__VLS_ctx.filteredData.length > 0)))
                                return;
                            if (!((__VLS_ctx.expandedRows.includes(group.destinationName))))
                                return;
                            __VLS_ctx.openCustomRateInput(group.destinationName);
                        } }, ...{ class: ("px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded ml-2") }, });
                (__VLS_ctx.customRates[group.destinationName] ? 'Edit' : 'Set Rate');
            }
        }
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-center py-12 bg-gray-800 rounded-lg") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-gray-400") }, });
    }
    if (__VLS_ctx.customRateModal.isOpen) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.customRateModal.isOpen)))
                        return;
                    __VLS_ctx.customRateModal.isOpen = false;
                } }, ...{ class: ("fixed inset-0 bg-black/50 flex items-center justify-center") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("bg-gray-800 p-4 rounded-lg w-96") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({ ...{ class: ("text-lg font-medium mb-4") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ ...{ onKeyup: (__VLS_ctx.saveCustomRate) }, ref: ("customRateInput"), type: ("number"), step: ("0.000001"), ...{ class: ("bg-gray-900 border border-gray-700 rounded px-3 py-2 w-full text-white mb-4") }, });
        (__VLS_ctx.customRateModal.value);
        // @ts-ignore navigation for `const customRateInput = ref()`
        __VLS_ctx.customRateInput;
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-end gap-2") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.customRateModal.isOpen)))
                        return;
                    __VLS_ctx.customRateModal.isOpen = false;
                } }, ...{ class: ("px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.saveCustomRate) }, ...{ class: ("px-3 py-1 text-sm bg-accent hover:bg-accent-hover text-white rounded") }, });
    }
    __VLS_styleScopedClasses['space-y-4'];
    __VLS_styleScopedClasses['bg-gray-800'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['p-4'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['gap-4'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['gap-2'];
    __VLS_styleScopedClasses['inline-flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['gap-1'];
    __VLS_styleScopedClasses['px-2.5'];
    __VLS_styleScopedClasses['py-1.5'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['text-red-400'];
    __VLS_styleScopedClasses['hover:text-red-300'];
    __VLS_styleScopedClasses['bg-red-400/10'];
    __VLS_styleScopedClasses['hover:bg-red-400/20'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['w-4'];
    __VLS_styleScopedClasses['h-4'];
    __VLS_styleScopedClasses['grid'];
    __VLS_styleScopedClasses['grid-cols-3'];
    __VLS_styleScopedClasses['gap-4'];
    __VLS_styleScopedClasses['block'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['mb-1'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['bg-gray-900'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['block'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['mb-1'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['bg-gray-900'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['block'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['mb-1'];
    __VLS_styleScopedClasses['space-y-2'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['bg-gray-700'];
    __VLS_styleScopedClasses['rounded-full'];
    __VLS_styleScopedClasses['h-2'];
    __VLS_styleScopedClasses['bg-accent'];
    __VLS_styleScopedClasses['h-2'];
    __VLS_styleScopedClasses['rounded-full'];
    __VLS_styleScopedClasses['transition-all'];
    __VLS_styleScopedClasses['duration-200'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['gap-2'];
    __VLS_styleScopedClasses['flex-1'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['bg-gray-700'];
    __VLS_styleScopedClasses['hover:bg-gray-600'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['opacity-50'];
    __VLS_styleScopedClasses['cursor-not-allowed'];
    __VLS_styleScopedClasses['flex-1'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['bg-gray-700'];
    __VLS_styleScopedClasses['hover:bg-gray-600'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['block'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['mb-1'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['inline-flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['gap-1'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['text-green-400'];
    __VLS_styleScopedClasses['hover:text-green-300'];
    __VLS_styleScopedClasses['bg-green-400/10'];
    __VLS_styleScopedClasses['hover:bg-green-400/20'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['w-4'];
    __VLS_styleScopedClasses['h-4'];
    __VLS_styleScopedClasses['overflow-hidden'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['bg-gray-800'];
    __VLS_styleScopedClasses['shadow'];
    __VLS_styleScopedClasses['min-w-full'];
    __VLS_styleScopedClasses['divide-y'];
    __VLS_styleScopedClasses['divide-gray-700'];
    __VLS_styleScopedClasses['bg-gray-900/50'];
    __VLS_styleScopedClasses['w-8'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['divide-y'];
    __VLS_styleScopedClasses['divide-gray-800'];
    __VLS_styleScopedClasses['hover:bg-gray-700/50'];
    __VLS_styleScopedClasses['cursor-pointer'];
    __VLS_styleScopedClasses['bg-red-900/10'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['h-5'];
    __VLS_styleScopedClasses['w-5'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['transition-transform'];
    __VLS_styleScopedClasses['rotate-90'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['ml-2'];
    __VLS_styleScopedClasses['inline-flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['bg-red-400/10'];
    __VLS_styleScopedClasses['px-2'];
    __VLS_styleScopedClasses['py-1'];
    __VLS_styleScopedClasses['text-xs'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-red-400'];
    __VLS_styleScopedClasses['ring-1'];
    __VLS_styleScopedClasses['ring-inset'];
    __VLS_styleScopedClasses['ring-red-400/20'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['bg-gray-900/30'];
    __VLS_styleScopedClasses['pl-8'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-gray-300'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-1'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['bg-accent'];
    __VLS_styleScopedClasses['hover:bg-accent-hover'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['space-y-2'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['p-2'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['bg-gray-800/50'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['gap-2'];
    __VLS_styleScopedClasses['flex-1'];
    __VLS_styleScopedClasses['cursor-pointer'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['w-2'];
    __VLS_styleScopedClasses['h-2'];
    __VLS_styleScopedClasses['rounded-full'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['p-2'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['gap-2'];
    __VLS_styleScopedClasses['flex-1'];
    __VLS_styleScopedClasses['cursor-pointer'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['gap-2'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['px-2'];
    __VLS_styleScopedClasses['py-1'];
    __VLS_styleScopedClasses['text-xs'];
    __VLS_styleScopedClasses['bg-gray-700'];
    __VLS_styleScopedClasses['hover:bg-gray-600'];
    __VLS_styleScopedClasses['rounded'];
    __VLS_styleScopedClasses['ml-2'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['py-12'];
    __VLS_styleScopedClasses['bg-gray-800'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['fixed'];
    __VLS_styleScopedClasses['inset-0'];
    __VLS_styleScopedClasses['bg-black/50'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['bg-gray-800'];
    __VLS_styleScopedClasses['p-4'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['w-96'];
    __VLS_styleScopedClasses['text-lg'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['bg-gray-900'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['rounded'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-end'];
    __VLS_styleScopedClasses['gap-2'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-1'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['bg-gray-700'];
    __VLS_styleScopedClasses['hover:bg-gray-600'];
    __VLS_styleScopedClasses['rounded'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-1'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['bg-accent'];
    __VLS_styleScopedClasses['hover:bg-accent-hover'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['rounded'];
    var __VLS_slots;
    var __VLS_inheritedAttrs;
    const __VLS_refs = {
        "customRateInput": __VLS_nativeElements['input'],
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
            ChevronRightIcon: ChevronRightIcon,
            TrashIcon: TrashIcon,
            ArrowDownTrayIcon: ArrowDownTrayIcon,
            store: store,
            expandedRows: expandedRows,
            filterStatus: filterStatus,
            searchQuery: searchQuery,
            customRates: customRates,
            customRateModal: customRateModal,
            customRateInput: customRateInput,
            isBulkProcessing: isBulkProcessing,
            processedCount: processedCount,
            totalToProcess: totalToProcess,
            filteredData: filteredData,
            toggleExpand: toggleExpand,
            formatRate: formatRate,
            isSelectedRate: isSelectedRate,
            isCustomRate: isCustomRate,
            selectRate: selectRate,
            enableCustomRate: enableCustomRate,
            hasUnsavedChanges: hasUnsavedChanges,
            saveRateSelection: saveRateSelection,
            openCustomRateInput: openCustomRateInput,
            saveCustomRate: saveCustomRate,
            handleBulkUpdate: handleBulkUpdate,
            handleClearData: handleClearData,
            handleExport: handleExport,
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
