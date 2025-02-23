const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const props = defineProps();
const fileKeys = ['file1', 'file2'];
function getFileName(file) {
    return props.report?.[file].fileName ?? '';
}
function getTotalCodes(file) {
    return props.report?.[file].totalCodes ?? 0;
}
function getTotalDestinations(file) {
    return props.report?.[file].totalDestinations ?? 0;
}
function getUniqueDestinationsPercentage(file) {
    return props.report?.[file].uniqueDestinationsPercentage.toFixed(2) ?? '0.00';
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("rounded-lg p-6 min-w-content bg-gray-800 pt-4") }, });
    if (__VLS_ctx.report) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("space-y-8") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("grid grid-cols-1 md:grid-cols-2 gap-8") }, });
        for (const [file] of __VLS_getVForSourceType((__VLS_ctx.fileKeys))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ key: ((file)), ...{ class: ("rounded-lg overflow-hidden border border-fbBorder") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({ ...{ class: ("py-3 text-xl text-center text-fbWhite px-6 border-b border-gray-700") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-accent") }, });
            (__VLS_ctx.getFileName(file));
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("p-6") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({ ...{ class: ("w-full") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ ...{ class: ("border-b border-gray-700") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-2 text-gray-400") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-2 text-right") }, });
            (__VLS_ctx.getTotalCodes(file));
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ ...{ class: ("border-b border-gray-700") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-2 text-gray-400") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-2 text-right") }, });
            (__VLS_ctx.getTotalDestinations(file));
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-2 font-medium text-gray-400") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-2 text-right") }, });
            (__VLS_ctx.getUniqueDestinationsPercentage(file));
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("rounded-lg overflow-hidden border border-fbBorder") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({ ...{ class: ("py-3 text-xl text-center text-fbWhite px-6 border-b border-gray-700") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-accent") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("p-6") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({ ...{ class: ("w-full") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ ...{ class: ("border-b border-gray-700") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-2 font-medium text-gray-400") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-2 text-right text-foreground") }, });
        (__VLS_ctx.report.matchedCodes);
        __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ ...{ class: ("border-b border-gray-700") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-2 font-medium text-gray-400") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-2 text-right text-foreground") }, });
        (__VLS_ctx.report.nonMatchedCodes);
        __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ ...{ class: ("border-b border-gray-700") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-2 font-medium text-gray-400") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-2 text-right text-foreground") }, });
        (__VLS_ctx.report.matchedCodesPercentage.toFixed(2));
        __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-2 font-medium text-gray-400") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-2 text-right text-foreground") }, });
        (__VLS_ctx.report.nonMatchedCodesPercentage.toFixed(2));
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-center text-xl text-muted-foreground") }, });
    }
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['min-w-content'];
    __VLS_styleScopedClasses['bg-gray-800'];
    __VLS_styleScopedClasses['pt-4'];
    __VLS_styleScopedClasses['space-y-8'];
    __VLS_styleScopedClasses['grid'];
    __VLS_styleScopedClasses['grid-cols-1'];
    __VLS_styleScopedClasses['md:grid-cols-2'];
    __VLS_styleScopedClasses['gap-8'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['overflow-hidden'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-fbBorder'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-xl'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['px-6'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['overflow-hidden'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-fbBorder'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-xl'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['px-6'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['text-xl'];
    __VLS_styleScopedClasses['text-muted-foreground'];
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
            fileKeys: fileKeys,
            getFileName: getFileName,
            getTotalCodes: getTotalCodes,
            getTotalDestinations: getTotalDestinations,
            getUniqueDestinationsPercentage: getUniqueDestinationsPercentage,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    __typeEl: {},
});
; /* PartiallyEnd: #4569/main.vue */
