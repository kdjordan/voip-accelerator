import USFileUploads from '@/components/us/USFileUploads.vue';
import USContentHeader from '@/components/us/USContentHeader.vue';
import { useUsStore } from '@/stores/us-store';
import { ReportTypes } from '@/types/app-types';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const usStore = useUsStore();
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
    // @ts-ignore
    [USContentHeader,];
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(USContentHeader, new USContentHeader({}));
    const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    const __VLS_5 = __VLS_resolvedLocalAndGlobalComponents.transition;
    /** @type { [typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ] } */
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({ name: ("fade"), mode: ("out-in"), appear: (true), }));
    const __VLS_7 = __VLS_6({ name: ("fade"), mode: ("out-in"), appear: (true), }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ key: ((__VLS_ctx.usStore.getActiveReportType)), });
    if (__VLS_ctx.usStore.activeReportType === __VLS_ctx.ReportTypes.FILES) {
        // @ts-ignore
        [USFileUploads,];
        // @ts-ignore
        const __VLS_11 = __VLS_asFunctionalComponent(USFileUploads, new USFileUploads({}));
        const __VLS_12 = __VLS_11({}, ...__VLS_functionalComponentArgsRest(__VLS_11));
    }
    __VLS_nonNullable(__VLS_10.slots).default;
    var __VLS_10;
    __VLS_styleScopedClasses['min-h-screen'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['p-8'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['text-sizeXl'];
    __VLS_styleScopedClasses['tracking-wide'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['uppercase'];
    __VLS_styleScopedClasses['mb-8'];
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
            USFileUploads: USFileUploads,
            USContentHeader: USContentHeader,
            ReportTypes: ReportTypes,
            usStore: usStore,
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
