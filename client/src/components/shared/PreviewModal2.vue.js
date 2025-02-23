import { ref, computed, watch } from 'vue';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const props = defineProps();
const startLine = ref(props.startLine);
// Filter preview data based on start line
const filteredPreviewData = computed(() => {
    return props.previewData
        .map((row, index) => ({
        rowNumber: index + 1,
        data: row,
    }))
        .slice(startLine.value - 1);
});
// Watch for start line changes
watch(startLine, newValue => {
    emit('update:start-line', newValue);
});
const emit = defineEmits();
const mappings = ref({});
// Initialize all columns with empty values
function initializeMappings() {
    props.columns.forEach((_, index) => {
        mappings.value[index] = '';
    });
}
// Call initialization when component is created
initializeMappings();
// Reset mappings when columns change
watch(() => props.columns, () => {
    initializeMappings();
});
function availableOptions(currentIndex) {
    // Create a set of used roles excluding the current column's role
    const usedRoles = new Set(Object.entries(mappings.value)
        .filter(([index, role]) => parseInt(index) !== currentIndex && role !== '')
        .map(([_, role]) => role));
    // Return only options that aren't already used
    return props.columnOptions.filter(option => !usedRoles.has(option.value));
}
// Check if all required columns are mapped
const allColumnsMapped = computed(() => {
    if (props.validateRequired) {
        // Only check required columns
        const requiredOptions = props.columnOptions.filter(option => option.required);
        const mappedRoles = new Set(Object.values(mappings.value));
        return requiredOptions.every(option => mappedRoles.has(option.value));
    }
    else {
        // Original behavior: check all columns
        const selectedCount = Object.values(mappings.value).filter(value => value !== '').length;
        return selectedCount === props.columnOptions.length;
    }
});
const shouldDisableSelects = computed(() => {
    if (props.validateRequired) {
        return false; // Never disable selects in validateRequired mode
    }
    return allColumnsMapped.value;
});
function handleMappingChange() {
    emit('update:mappings', mappings.value);
    // Emit the validation state whenever mappings change
    emit('update:valid', isValid.value);
}
function handleConfirm() {
    emit('confirm', mappings.value);
}
function handleCancel() {
    emit('cancel');
}
// Let parent component handle validation
const isValid = computed(() => {
    return allColumnsMapped.value;
});
; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_fnComponent = (await import('vue')).defineComponent({
    __typeEmits: {},
});
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
    const __VLS_0 = __VLS_resolvedLocalAndGlobalComponents.transition;
    /** @type { [typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ] } */
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({ enterActiveClass: ("ease-out duration-300"), enterClass: ("opacity-0"), enterToClass: ("opacity-100"), leaveActiveClass: ("ease-in duration-200"), leaveClass: ("opacity-100"), leaveToClass: ("opacity-0"), }));
    const __VLS_2 = __VLS_1({ enterActiveClass: ("ease-out duration-300"), enterClass: ("opacity-0"), enterToClass: ("opacity-100"), leaveActiveClass: ("ease-in duration-200"), leaveClass: ("opacity-100"), leaveToClass: ("opacity-0"), }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_6 = {};
    if (__VLS_ctx.showModal) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("fixed inset-0 z-50 overflow-y-auto") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex min-h-screen items-center justify-center") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onClick: (__VLS_ctx.handleCancel) }, ...{ class: ("fixed inset-0 bg-black/80") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("relative transform rounded-lg bg-fbBlack text-left shadow-xl transition-all m-4 w-full max-w-7xl max-h-[90vh] flex flex-col") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("px-4 pt-5 pb-4 sm:p-6 sm:pb-4 overflow-auto") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex justify-between items-center mb-6") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({ ...{ class: ("text-lg leading-6 font-medium text-fbWhite") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex flex-col items-center gap-2") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({ for: ("start-line"), ...{ class: ("block text-sm font-medium text-fbWhite/70") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({ id: ("start-line"), value: ((__VLS_ctx.startLine)), ...{ class: ("select-custom mt-1 block w-32 bg-fbHover text-fbWhite rounded-md py-2 pl-3 focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm") }, });
        for (const [i] of __VLS_getVForSourceType((15))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({ key: ((i)), value: ((i)), });
            (i);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("mb-8") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("mt-2 overflow-auto max-h-80") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({ ...{ class: ("min-w-full rounded-lg overflow-hidden") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({ ...{ class: ("bg-fbHover") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("min-w-[80px] p-1 text-left") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-base text-fbWhite pl-3") }, });
        for (const [column, index] of __VLS_getVForSourceType((__VLS_ctx.columns))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ key: ((index)), ...{ class: ("px-6 py-3 text-left text-xs font-medium text-fbWhite/70 uppercase tracking-wider") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({ ...{ onChange: (__VLS_ctx.handleMappingChange) }, value: ((__VLS_ctx.mappings[index])), ...{ class: ("select-custom min-w-[180px] block w-full rounded-md py-2 pl-3 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-accent") }, ...{ class: (({
                        'bg-accent/20 text-accent border border-accent/50': __VLS_ctx.mappings[index] !== '',
                        'bg-fbHover text-fbWhite border border-fbWhite/20': __VLS_ctx.mappings[index] === '' && (!__VLS_ctx.allColumnsMapped || props.validateRequired),
                        'bg-fbHover/30 text-fbWhite/30 border border-fbWhite/10 cursor-not-allowed': __VLS_ctx.mappings[index] === '' && __VLS_ctx.allColumnsMapped && !props.validateRequired,
                    })) }, disabled: ((__VLS_ctx.mappings[index] === '' && __VLS_ctx.allColumnsMapped && !props.validateRequired)), });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({ value: (""), });
            for (const [option] of __VLS_getVForSourceType((__VLS_ctx.availableOptions(index)))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({ key: ((option.value)), value: ((option.value)), });
                (option.label);
            }
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
        for (const [row] of __VLS_getVForSourceType((__VLS_ctx.filteredPreviewData))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ key: ((row.rowNumber)), ...{ class: ((['transition-colors', row.rowNumber % 2 === 0 ? 'bg-transparent' : 'bg-fbHover/30'])) }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("px-4 py-2") }, });
            (row.rowNumber);
            for (const [cell, cellIndex] of __VLS_getVForSourceType((row.data))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ key: ((cellIndex)), ...{ class: ("px-6 py-4 whitespace-nowrap") }, });
                (cell);
            }
        }
        if (__VLS_ctx.filteredPreviewData.length === 0) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ ...{ class: ("text-center text-fbWhite/50") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ colspan: ((__VLS_ctx.columns.length + 1)), ...{ class: ("px-6 py-4") }, });
            (__VLS_ctx.startLine);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-4 bg-fbHover/30 border-t border-fbWhite/10") }, });
        var __VLS_7 = {
            isValid: ((__VLS_ctx.isValid)), handleConfirm: ((__VLS_ctx.handleConfirm)), handleCancel: ((__VLS_ctx.handleCancel)),
        };
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.handleConfirm) }, disabled: ((!__VLS_ctx.isValid)), ...{ class: (([
                    'px-6 py-2 rounded-lg transition-colors',
                    __VLS_ctx.isValid
                        ? 'bg-accent/20 border border-accent/50 hover:bg-accent/30 text-accent'
                        : 'bg-fbHover/50 text-fbWhite/50 border border-fbWhite/20 cursor-not-allowed',
                ])) }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.handleCancel) }, ...{ class: ("border border-destructive/50 bg-destructive/20 hover:bg-destructive/30 text-destructive transition-all text-xl rounded-md px-2") }, });
        __VLS_nonNullable(__VLS_5.slots).default;
    }
    __VLS_nonNullable(__VLS_5.slots).default;
    var __VLS_5;
    __VLS_styleScopedClasses['fixed'];
    __VLS_styleScopedClasses['inset-0'];
    __VLS_styleScopedClasses['z-50'];
    __VLS_styleScopedClasses['overflow-y-auto'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['min-h-screen'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['fixed'];
    __VLS_styleScopedClasses['inset-0'];
    __VLS_styleScopedClasses['bg-black/80'];
    __VLS_styleScopedClasses['relative'];
    __VLS_styleScopedClasses['transform'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['bg-fbBlack'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['shadow-xl'];
    __VLS_styleScopedClasses['transition-all'];
    __VLS_styleScopedClasses['m-4'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['max-w-7xl'];
    __VLS_styleScopedClasses['max-h-[90vh]'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['flex-col'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['pt-5'];
    __VLS_styleScopedClasses['pb-4'];
    __VLS_styleScopedClasses['sm:p-6'];
    __VLS_styleScopedClasses['sm:pb-4'];
    __VLS_styleScopedClasses['overflow-auto'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['mb-6'];
    __VLS_styleScopedClasses['text-lg'];
    __VLS_styleScopedClasses['leading-6'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['flex-col'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['gap-2'];
    __VLS_styleScopedClasses['block'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-fbWhite/70'];
    __VLS_styleScopedClasses['select-custom'];
    __VLS_styleScopedClasses['mt-1'];
    __VLS_styleScopedClasses['block'];
    __VLS_styleScopedClasses['w-32'];
    __VLS_styleScopedClasses['bg-fbHover'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['pl-3'];
    __VLS_styleScopedClasses['focus:outline-none'];
    __VLS_styleScopedClasses['focus:ring-1'];
    __VLS_styleScopedClasses['focus:ring-accent'];
    __VLS_styleScopedClasses['sm:text-sm'];
    __VLS_styleScopedClasses['mb-8'];
    __VLS_styleScopedClasses['mt-2'];
    __VLS_styleScopedClasses['overflow-auto'];
    __VLS_styleScopedClasses['max-h-80'];
    __VLS_styleScopedClasses['min-w-full'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['overflow-hidden'];
    __VLS_styleScopedClasses['bg-fbHover'];
    __VLS_styleScopedClasses['min-w-[80px]'];
    __VLS_styleScopedClasses['p-1'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-base'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['pl-3'];
    __VLS_styleScopedClasses['px-6'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-xs'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-fbWhite/70'];
    __VLS_styleScopedClasses['uppercase'];
    __VLS_styleScopedClasses['tracking-wider'];
    __VLS_styleScopedClasses['select-custom'];
    __VLS_styleScopedClasses['min-w-[180px]'];
    __VLS_styleScopedClasses['block'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['pl-3'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['duration-200'];
    __VLS_styleScopedClasses['focus:outline-none'];
    __VLS_styleScopedClasses['focus:ring-1'];
    __VLS_styleScopedClasses['focus:ring-accent'];
    __VLS_styleScopedClasses['bg-accent/20'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-accent/50'];
    __VLS_styleScopedClasses['bg-fbHover'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-fbWhite/20'];
    __VLS_styleScopedClasses['bg-fbHover/30'];
    __VLS_styleScopedClasses['text-fbWhite/30'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-fbWhite/10'];
    __VLS_styleScopedClasses['cursor-not-allowed'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['px-6'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['whitespace-nowrap'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['text-fbWhite/50'];
    __VLS_styleScopedClasses['px-6'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['sm:px-6'];
    __VLS_styleScopedClasses['sm:flex'];
    __VLS_styleScopedClasses['sm:flex-row-reverse'];
    __VLS_styleScopedClasses['gap-4'];
    __VLS_styleScopedClasses['bg-fbHover/30'];
    __VLS_styleScopedClasses['border-t'];
    __VLS_styleScopedClasses['border-fbWhite/10'];
    __VLS_styleScopedClasses['px-6'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-destructive/50'];
    __VLS_styleScopedClasses['bg-destructive/20'];
    __VLS_styleScopedClasses['hover:bg-destructive/30'];
    __VLS_styleScopedClasses['text-destructive'];
    __VLS_styleScopedClasses['transition-all'];
    __VLS_styleScopedClasses['text-xl'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['px-2'];
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
            startLine: startLine,
            filteredPreviewData: filteredPreviewData,
            mappings: mappings,
            availableOptions: availableOptions,
            allColumnsMapped: allColumnsMapped,
            handleMappingChange: handleMappingChange,
            handleConfirm: handleConfirm,
            handleCancel: handleCancel,
            isValid: isValid,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
    __typeEl: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
