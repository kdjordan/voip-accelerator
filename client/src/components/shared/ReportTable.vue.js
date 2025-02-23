import { ref } from 'vue';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const __VLS_props = defineProps();
const expandedDialCodes = ref({});
function toggleDialCodes(index) {
    expandedDialCodes.value[index] = !expandedDialCodes.value[index];
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("overflow-x-auto") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({ ...{ class: ("w-full border-collapse") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ ...{ class: ("border-b border-gray-700") }, });
    for (const [header] of __VLS_getVForSourceType((__VLS_ctx.headers))) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ key: ((header)), ...{ class: ("p-3 text-left font-medium text-gray-400") }, });
        (header);
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
    for (const [item, index] of __VLS_getVForSourceType((__VLS_ctx.items))) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ key: ((index)), ...{ class: ("border-b border-gray-700 hover:bg-gray-800 hover:bg-opacity-50") }, });
        for (const [value, key] of __VLS_getVForSourceType((item))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ key: ((key)), ...{ class: ("p-3") }, ...{ class: (({ 'w-48 max-w-xs': key === 'dialCode' })) }, });
            if (key === 'dialCode') {
                if (value.length > 20) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                                if (!((key === 'dialCode')))
                                    return;
                                if (!((value.length > 20)))
                                    return;
                                __VLS_ctx.toggleDialCodes(index);
                            } }, ...{ class: ("text-blue-500 hover:underline") }, });
                    (__VLS_ctx.expandedDialCodes[index] ? 'Hide Codes' : 'Show Codes');
                    if (__VLS_ctx.expandedDialCodes[index]) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("mt-2 overflow-x-auto max-h-40") }, });
                        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("whitespace-normal break-words") }, });
                        (value);
                    }
                }
                else {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("whitespace-normal break-words") }, });
                    (value);
                }
            }
            else {
                (value);
            }
        }
    }
    __VLS_styleScopedClasses['overflow-x-auto'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['border-collapse'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['p-3'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['font-medium'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['hover:bg-gray-800'];
    __VLS_styleScopedClasses['hover:bg-opacity-50'];
    __VLS_styleScopedClasses['p-3'];
    __VLS_styleScopedClasses['w-48'];
    __VLS_styleScopedClasses['max-w-xs'];
    __VLS_styleScopedClasses['text-blue-500'];
    __VLS_styleScopedClasses['hover:underline'];
    __VLS_styleScopedClasses['mt-2'];
    __VLS_styleScopedClasses['overflow-x-auto'];
    __VLS_styleScopedClasses['max-h-40'];
    __VLS_styleScopedClasses['whitespace-normal'];
    __VLS_styleScopedClasses['break-words'];
    __VLS_styleScopedClasses['whitespace-normal'];
    __VLS_styleScopedClasses['break-words'];
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
            expandedDialCodes: expandedDialCodes,
            toggleDialCodes: toggleDialCodes,
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
