import AZFileUploads from '@/components/az/AZFileUploads.vue';
import CodeReportAZ from '@/components/az/AZCodeReport.vue';
import PricingReportAZ from '@/components/az/AZPricingReport.vue';
import AZContentHeader from '@/components/az/AZContentHeader.vue';
import { useAzStore } from '@/stores/az-store';
import { ReportTypes } from '@/types/app-types';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const azStore = useAzStore();
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-sizeXl tracking-wide text-accent uppercase  rounded-lg px-4 py-2") }, });
    // @ts-ignore
    [AZContentHeader,];
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(AZContentHeader, new AZContentHeader({}));
    const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    const __VLS_5 = __VLS_resolvedLocalAndGlobalComponents.transition;
    /** @type { [typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ] } */
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({ name: ("fade"), mode: ("out-in"), appear: (true), }));
    const __VLS_7 = __VLS_6({ name: ("fade"), mode: ("out-in"), appear: (true), }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ key: ((__VLS_ctx.azStore.getActiveReportType)), });
    if (__VLS_ctx.azStore.getActiveReportType === __VLS_ctx.ReportTypes.FILES) {
        // @ts-ignore
        [AZFileUploads,];
        // @ts-ignore
        const __VLS_11 = __VLS_asFunctionalComponent(AZFileUploads, new AZFileUploads({}));
        const __VLS_12 = __VLS_11({}, ...__VLS_functionalComponentArgsRest(__VLS_11));
    }
    if (__VLS_ctx.azStore.getActiveReportType === __VLS_ctx.ReportTypes.CODE) {
        // @ts-ignore
        [CodeReportAZ,];
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent(CodeReportAZ, new CodeReportAZ({ report: ((__VLS_ctx.azStore.getCodeReport)), }));
        const __VLS_17 = __VLS_16({ report: ((__VLS_ctx.azStore.getCodeReport)), }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    }
    if (__VLS_ctx.azStore.getActiveReportType === __VLS_ctx.ReportTypes.PRICING) {
        // @ts-ignore
        [PricingReportAZ,];
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(PricingReportAZ, new PricingReportAZ({ report: ((__VLS_ctx.azStore.getPricingReport)), }));
        const __VLS_22 = __VLS_21({ report: ((__VLS_ctx.azStore.getPricingReport)), }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    }
    __VLS_nonNullable(__VLS_10.slots).default;
    var __VLS_10;
    __VLS_styleScopedClasses['min-h-screen'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['p-8'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['mb-8'];
    __VLS_styleScopedClasses['text-sizeXl'];
    __VLS_styleScopedClasses['tracking-wide'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['uppercase'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-2'];
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
            AZFileUploads: AZFileUploads,
            CodeReportAZ: CodeReportAZ,
            PricingReportAZ: PricingReportAZ,
            AZContentHeader: AZContentHeader,
            ReportTypes: ReportTypes,
            azStore: azStore,
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
