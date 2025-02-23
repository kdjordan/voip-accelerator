import { ref } from 'vue';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const dropdownOpen = ref(false);
function toggleDropdown() {
    dropdownOpen.value = !dropdownOpen.value;
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({ ...{ class: ("w-full bg-background text-foreground flex justify-end items-center px-8 h-24 border-b border-gray-600") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("relative") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.toggleDropdown) }, ...{ class: ("flex items-center justify-center h-12 w-12 bg-background hover:bg-accent border border-accent rounded-full text-xl font-bold text-accent hover:text-background") }, });
    if (__VLS_ctx.dropdownOpen) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("absolute right-0 mt-2 w-64 bg-background rounded-md shadow-lg z-50") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("p-4") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex flex-col items-center mb-4") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({ ...{ class: ("text-base text-foreground") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-sm text-gray-400") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("w-full bg-gray-400 rounded-full h-2.5 mb-4") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("bg-accent h-2.5 rounded-full") }, ...{ style: ({}) }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-sizeSm text-foreground block mb-2") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ class: ("btn btn-primary w-full") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ class: ("btn btn-primary w-full my-4") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ class: ("btn btn-destructive w-full") }, });
    }
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['bg-background'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-end'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['px-8'];
    __VLS_styleScopedClasses['h-24'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-600'];
    __VLS_styleScopedClasses['relative'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['h-12'];
    __VLS_styleScopedClasses['w-12'];
    __VLS_styleScopedClasses['bg-background'];
    __VLS_styleScopedClasses['hover:bg-accent'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-accent'];
    __VLS_styleScopedClasses['rounded-full'];
    __VLS_styleScopedClasses['text-xl'];
    __VLS_styleScopedClasses['font-bold'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['hover:text-background'];
    __VLS_styleScopedClasses['absolute'];
    __VLS_styleScopedClasses['right-0'];
    __VLS_styleScopedClasses['mt-2'];
    __VLS_styleScopedClasses['w-64'];
    __VLS_styleScopedClasses['bg-background'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['shadow-lg'];
    __VLS_styleScopedClasses['z-50'];
    __VLS_styleScopedClasses['p-4'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['flex-col'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['text-base'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['bg-gray-400'];
    __VLS_styleScopedClasses['rounded-full'];
    __VLS_styleScopedClasses['h-2.5'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['bg-accent'];
    __VLS_styleScopedClasses['h-2.5'];
    __VLS_styleScopedClasses['rounded-full'];
    __VLS_styleScopedClasses['text-sizeSm'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['block'];
    __VLS_styleScopedClasses['mb-2'];
    __VLS_styleScopedClasses['btn'];
    __VLS_styleScopedClasses['btn-primary'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['btn'];
    __VLS_styleScopedClasses['btn-primary'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['my-4'];
    __VLS_styleScopedClasses['btn'];
    __VLS_styleScopedClasses['btn-destructive'];
    __VLS_styleScopedClasses['w-full'];
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
            dropdownOpen: dropdownOpen,
            toggleDropdown: toggleDropdown,
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
