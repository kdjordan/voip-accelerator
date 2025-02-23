import { ref } from 'vue';
import { useAzStore } from '@/stores/az-store';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const azStore = useAzStore();
const expandedRows = ref(new Set());
const props = defineProps();
const showUnmatchedCodes = ref(false);
function toggleUnmatchedCodes() {
    showUnmatchedCodes.value = !showUnmatchedCodes.value;
}
function toggleExpandRow(dialCode) {
    if (expandedRows.value.has(dialCode)) {
        expandedRows.value.delete(dialCode);
    }
    else {
        expandedRows.value.add(dialCode);
    }
}
function isRowExpanded(dialCode) {
    return expandedRows.value.has(dialCode);
}
function formatPercentage(value) {
    return value.toFixed(2);
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
    if (__VLS_ctx.report) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("space-y-10 bg-gray-800 p-6") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("rounded-lg") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({ ...{ class: ("py-4 text-sizeLg text-center text-fbWhite px-6 border-b border-gray-700") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-fbWhite") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("uppercase") }, });
        (__VLS_ctx.report.fileName1);
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("uppercase") }, });
        (__VLS_ctx.report.fileName2);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("p-6 overflow-x-auto") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({ ...{ class: ("w-full") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ ...{ class: ("border-b border-gray-700") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-left text-gray-400 px-4 max-w-[250px] w-[250px]") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-left text-gray-400 px-4") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-right text-gray-400 px-4") }, });
        (__VLS_ctx.report.fileName1);
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-right text-gray-400 px-4") }, });
        (__VLS_ctx.report.fileName2);
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-right text-gray-400 px-4") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.report.higherRatesForFile1))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ key: ((item.dialCode)), ...{ class: ("border-b border-gray-700") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-foreground px-4 max-w-[250px] w-[250px]") }, });
            if (item.dialCode.split(',').length > 3) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                if (!__VLS_ctx.isRowExpanded(item.dialCode)) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (item.dialCode.split(',')[0]);
                }
                else {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (item.dialCode);
                }
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                            if (!((__VLS_ctx.report)))
                                return;
                            if (!((item.dialCode.split(',').length > 3)))
                                return;
                            __VLS_ctx.toggleExpandRow(item.dialCode);
                        } }, ...{ class: ("ml-2 px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-800 transition-colors duration-300") }, w: (true), });
                (__VLS_ctx.isRowExpanded(item.dialCode) ? 'Show Less' : 'Show More');
            }
            else {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                (item.dialCode);
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-foreground px-4") }, });
            (item.destName);
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-right text-foreground px-4") }, });
            (item.rateFile1);
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-right text-foreground px-4") }, });
            (item.rateFile2);
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-right text-green-500 px-4") }, });
            (__VLS_ctx.formatPercentage(item.percentageDifference));
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("rounded-lg w-full") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({ ...{ class: ("py-4 text-sizeLg text-center text-fbWhite px-6 border-b border-fbBorder") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-fbWhite") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("uppercase") }, });
        (__VLS_ctx.report.fileName1);
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("uppercase") }, });
        (__VLS_ctx.report.fileName2);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("p-6 overflow-x-auto") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({ ...{ class: ("w-full") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ ...{ class: ("border-b border-fbBorder") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-left px-4 max-w-[250px] w-[250px]") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-left text-gray-400 px-4") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-right text-gray-400 px-4") }, });
        (__VLS_ctx.report.fileName1);
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-right text-gray-400 px-4") }, });
        (__VLS_ctx.report.fileName2);
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-right text-gray-400 px-4") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.report.higherRatesForFile2))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ key: ((item.dialCode)), ...{ class: ("border-b border-gray-700") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-foreground px-4 max-w-[250px] w-[250px]") }, });
            if (item.dialCode.split(',').length > 3) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                if (!__VLS_ctx.isRowExpanded(item.dialCode)) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (item.dialCode.split(',')[0]);
                }
                else {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (item.dialCode);
                }
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                            if (!((__VLS_ctx.report)))
                                return;
                            if (!((item.dialCode.split(',').length > 3)))
                                return;
                            __VLS_ctx.toggleExpandRow(item.dialCode);
                        } }, ...{ class: ("ml-2 px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-800 transition-colors duration-300") }, });
                (__VLS_ctx.isRowExpanded(item.dialCode) ? 'Show Less' : 'Show More');
            }
            else {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                (item.dialCode);
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-foreground px-4") }, });
            (item.destName);
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-right text-foreground px-4") }, });
            (item.rateFile1);
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-right text-foreground px-4") }, });
            (item.rateFile2);
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-right text-red-500 px-4") }, });
            (__VLS_ctx.formatPercentage(item.percentageDifference));
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("rounded-lg overflow-hidden border border-fbBorder") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({ ...{ class: ("py-4 text-sizeLg text-center text-fbWhite px-6 border-b border-fbBorder") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("p-6 overflow-x-auto") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({ ...{ class: ("w-full") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ ...{ class: ("border-b border-gray-700") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-left text-gray-400 px-4 max-w-[250px] w-[250px]") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-left text-gray-400 px-4") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-right text-gray-400 px-4") }, });
        (__VLS_ctx.report.fileName1);
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-right text-gray-400 px-4") }, });
        (__VLS_ctx.report.fileName2);
        __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.report.sameRates))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ key: ((item.dialCode)), ...{ class: ("border-b border-gray-700") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-foreground px-4 max-w-[250px] w-[250px]") }, });
            if (item.dialCode.split(',').length > 3) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                if (!__VLS_ctx.isRowExpanded(item.dialCode)) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (item.dialCode.split(',')[0]);
                }
                else {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (item.dialCode);
                }
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                            if (!((__VLS_ctx.report)))
                                return;
                            if (!((item.dialCode.split(',').length > 3)))
                                return;
                            __VLS_ctx.toggleExpandRow(item.dialCode);
                        } }, ...{ class: ("ml-2 px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-800 transition-colors duration-300") }, });
                (__VLS_ctx.isRowExpanded(item.dialCode) ? 'Show Less' : 'Show More');
            }
            else {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                (item.dialCode);
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-foreground px-4") }, });
            (item.destName);
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-right text-foreground px-4") }, });
            (item.rateFile1);
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-right text-foreground px-4") }, });
            (item.rateFile2);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("rounded-lg overflow-hidden border border-fbBorder") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("py-4 px-6 flex justify-between items-center border-b border-fbBorder") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("w-1/4") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({ ...{ class: ("py-4 text-sizeLg text-center text-fbWhite px-6") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("w-1/4 flex justify-end") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.toggleUnmatchedCodes) }, ...{ class: ("btn-accent btn-lg") }, });
        (__VLS_ctx.showUnmatchedCodes ? 'Hide' : 'Show');
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("p-6") }, });
        if (__VLS_ctx.showUnmatchedCodes) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({ ...{ class: ("w-full") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ ...{ class: ("border-b border-gray-700") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-left text-gray-400 px-4 max-w-[250px] w-[250px]") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ ...{ class: ("py-3 text-left text-gray-400 px-4") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
            for (const [code] of __VLS_getVForSourceType((__VLS_ctx.report.nonMatchingCodes))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ key: ((code.dialCode)), ...{ class: ("border-b border-gray-700") }, });
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-foreground px-4 max-w-[250px] w-[250px]") }, });
                if (code.dialCode.split(',').length > 3) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                    if (!__VLS_ctx.isRowExpanded(code.dialCode)) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                        (code.dialCode.split(',')[0]);
                    }
                    else {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                        (code.dialCode);
                    }
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                                if (!((__VLS_ctx.report)))
                                    return;
                                if (!((__VLS_ctx.showUnmatchedCodes)))
                                    return;
                                if (!((code.dialCode.split(',').length > 3)))
                                    return;
                                __VLS_ctx.toggleExpandRow(code.dialCode);
                            } }, ...{ class: ("ml-2 px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-800 transition-colors duration-300") }, });
                    (__VLS_ctx.isRowExpanded(code.dialCode) ? 'Show Less' : 'Show More');
                }
                else {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                    (code.dialCode);
                }
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ ...{ class: ("py-3 text-foreground px-4") }, });
                (code.destName);
            }
        }
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-center text-xl text-muted-foreground") }, });
    }
    __VLS_styleScopedClasses['space-y-10'];
    __VLS_styleScopedClasses['bg-gray-800'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['text-sizeLg'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['px-6'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['uppercase'];
    __VLS_styleScopedClasses['uppercase'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['overflow-x-auto'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['max-w-[250px]'];
    __VLS_styleScopedClasses['w-[250px]'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['max-w-[250px]'];
    __VLS_styleScopedClasses['w-[250px]'];
    __VLS_styleScopedClasses['ml-2'];
    __VLS_styleScopedClasses['px-2'];
    __VLS_styleScopedClasses['py-1'];
    __VLS_styleScopedClasses['text-xs'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['bg-blue-500'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['hover:bg-blue-800'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['duration-300'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-green-500'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['text-sizeLg'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['px-6'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-fbBorder'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['uppercase'];
    __VLS_styleScopedClasses['uppercase'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['overflow-x-auto'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-fbBorder'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['max-w-[250px]'];
    __VLS_styleScopedClasses['w-[250px]'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['max-w-[250px]'];
    __VLS_styleScopedClasses['w-[250px]'];
    __VLS_styleScopedClasses['ml-2'];
    __VLS_styleScopedClasses['px-2'];
    __VLS_styleScopedClasses['py-1'];
    __VLS_styleScopedClasses['text-xs'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['bg-blue-500'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['hover:bg-blue-800'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['duration-300'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-red-500'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['overflow-hidden'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-fbBorder'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['text-sizeLg'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['px-6'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-fbBorder'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['overflow-x-auto'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['max-w-[250px]'];
    __VLS_styleScopedClasses['w-[250px]'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['max-w-[250px]'];
    __VLS_styleScopedClasses['w-[250px]'];
    __VLS_styleScopedClasses['ml-2'];
    __VLS_styleScopedClasses['px-2'];
    __VLS_styleScopedClasses['py-1'];
    __VLS_styleScopedClasses['text-xs'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['bg-blue-500'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['hover:bg-blue-800'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['duration-300'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-right'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['overflow-hidden'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-fbBorder'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['px-6'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-fbBorder'];
    __VLS_styleScopedClasses['w-1/4'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['text-sizeLg'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['px-6'];
    __VLS_styleScopedClasses['w-1/4'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-end'];
    __VLS_styleScopedClasses['btn-accent'];
    __VLS_styleScopedClasses['btn-lg'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['max-w-[250px]'];
    __VLS_styleScopedClasses['w-[250px]'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['max-w-[250px]'];
    __VLS_styleScopedClasses['w-[250px]'];
    __VLS_styleScopedClasses['ml-2'];
    __VLS_styleScopedClasses['px-2'];
    __VLS_styleScopedClasses['py-1'];
    __VLS_styleScopedClasses['text-xs'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['bg-blue-500'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['hover:bg-blue-800'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['duration-300'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['px-4'];
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
            showUnmatchedCodes: showUnmatchedCodes,
            toggleUnmatchedCodes: toggleUnmatchedCodes,
            toggleExpandRow: toggleExpandRow,
            isRowExpanded: isRowExpanded,
            formatPercentage: formatPercentage,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
