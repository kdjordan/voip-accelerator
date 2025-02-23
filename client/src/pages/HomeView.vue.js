import { ref } from 'vue';
import { useIntersectionObserver } from '@vueuse/core';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const heroSection = ref(null);
const isHeroVisible = ref(false);
useIntersectionObserver(heroSection, ([{ isIntersecting }]) => {
    isHeroVisible.value = isIntersecting;
}, { threshold: 0.5 });
const features = [
    { title: 'Dynamic Pricing', description: 'Automatically adjust prices based on market demand and competition' },
    { title: 'Data-Driven Insights', description: 'Make informed decisions with real-time analytics and reporting' },
    { title: 'Customizable Strategies', description: 'Tailor pricing rules to fit your unique business needs' },
]; /* PartiallyEnd: #3632/scriptSetup.vue */
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({ ...{ class: ("min-h-screen bg-gradient-to-b from-gray-50 to-gray-100") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({ ref: ("heroSection"), ...{ class: ("relative min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white overflow-hidden") }, });
    // @ts-ignore navigation for `const heroSection = ref()`
    __VLS_ctx.heroSection;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("absolute inset-0 bg-[url('/path-to-pattern.svg')] opacity-10") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("container mx-auto px-4 text-center relative z-10") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({ ...{ class: ("text-4xl md:text-6xl font-bold mb-6 leading-tight") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.br, __VLS_intrinsicElements.br)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-xl md:text-2xl mb-8 max-w-2xl mx-auto") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ class: ("bg-white text-blue-600 font-semibold py-3 px-8 rounded-full hover:bg-blue-50 transition duration-300 shadow-lg") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent") }, ...{ class: (({ 'opacity-100': __VLS_ctx.isHeroVisible, 'opacity-0': !__VLS_ctx.isHeroVisible })) }, ...{ style: ({}) }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({ ...{ class: ("py-20") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("container mx-auto px-4") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({ ...{ class: ("text-3xl font-bold text-center mb-12 text-gray-800") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("grid grid-cols-1 md:grid-cols-3 gap-8") }, });
    for (const [feature] of __VLS_getVForSourceType((__VLS_ctx.features))) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ key: ((feature.title)), ...{ class: ("bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({ ...{ class: ("text-xl font-semibold mb-4 text-blue-600") }, });
        (feature.title);
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-gray-600") }, });
        (feature.description);
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({ ...{ class: ("bg-gradient-to-r from-indigo-600 to-blue-600 py-20 text-white") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("container mx-auto px-4 text-center") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({ ...{ class: ("text-3xl font-bold mb-6") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-xl mb-8 max-w-2xl mx-auto") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ class: ("bg-white text-blue-600 font-semibold py-3 px-8 rounded-full hover:bg-blue-50 transition duration-300 shadow-lg") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({ ...{ class: ("py-20 bg-gray-50") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("container mx-auto px-4 text-center") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({ ...{ class: ("text-3xl font-bold mb-12 text-gray-800") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.blockquote, __VLS_intrinsicElements.blockquote)({ ...{ class: ("text-xl italic text-gray-600 max-w-3xl mx-auto") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("mt-4 font-semibold text-blue-600") }, });
    __VLS_styleScopedClasses['min-h-screen'];
    __VLS_styleScopedClasses['bg-gradient-to-b'];
    __VLS_styleScopedClasses['from-gray-50'];
    __VLS_styleScopedClasses['to-gray-100'];
    __VLS_styleScopedClasses['relative'];
    __VLS_styleScopedClasses['min-h-screen'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['bg-gradient-to-r'];
    __VLS_styleScopedClasses['from-blue-600'];
    __VLS_styleScopedClasses['to-indigo-700'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['overflow-hidden'];
    __VLS_styleScopedClasses['absolute'];
    __VLS_styleScopedClasses['inset-0'];
    __VLS_styleScopedClasses['bg-[url(\'/path-to-pattern.svg\')]'];
    __VLS_styleScopedClasses['opacity-10'];
    __VLS_styleScopedClasses['container'];
    __VLS_styleScopedClasses['mx-auto'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['relative'];
    __VLS_styleScopedClasses['z-10'];
    __VLS_styleScopedClasses['text-4xl'];
    __VLS_styleScopedClasses['md:text-6xl'];
    __VLS_styleScopedClasses['font-bold'];
    __VLS_styleScopedClasses['mb-6'];
    __VLS_styleScopedClasses['leading-tight'];
    __VLS_styleScopedClasses['text-xl'];
    __VLS_styleScopedClasses['md:text-2xl'];
    __VLS_styleScopedClasses['mb-8'];
    __VLS_styleScopedClasses['max-w-2xl'];
    __VLS_styleScopedClasses['mx-auto'];
    __VLS_styleScopedClasses['bg-white'];
    __VLS_styleScopedClasses['text-blue-600'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['px-8'];
    __VLS_styleScopedClasses['rounded-full'];
    __VLS_styleScopedClasses['hover:bg-blue-50'];
    __VLS_styleScopedClasses['transition'];
    __VLS_styleScopedClasses['duration-300'];
    __VLS_styleScopedClasses['shadow-lg'];
    __VLS_styleScopedClasses['absolute'];
    __VLS_styleScopedClasses['bottom-0'];
    __VLS_styleScopedClasses['left-0'];
    __VLS_styleScopedClasses['right-0'];
    __VLS_styleScopedClasses['h-24'];
    __VLS_styleScopedClasses['bg-gradient-to-t'];
    __VLS_styleScopedClasses['from-gray-50'];
    __VLS_styleScopedClasses['to-transparent'];
    __VLS_styleScopedClasses['opacity-100'];
    __VLS_styleScopedClasses['opacity-0'];
    __VLS_styleScopedClasses['py-20'];
    __VLS_styleScopedClasses['container'];
    __VLS_styleScopedClasses['mx-auto'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['text-3xl'];
    __VLS_styleScopedClasses['font-bold'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['mb-12'];
    __VLS_styleScopedClasses['text-gray-800'];
    __VLS_styleScopedClasses['grid'];
    __VLS_styleScopedClasses['grid-cols-1'];
    __VLS_styleScopedClasses['md:grid-cols-3'];
    __VLS_styleScopedClasses['gap-8'];
    __VLS_styleScopedClasses['bg-white'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['shadow-md'];
    __VLS_styleScopedClasses['hover:shadow-lg'];
    __VLS_styleScopedClasses['transition'];
    __VLS_styleScopedClasses['duration-300'];
    __VLS_styleScopedClasses['text-xl'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['text-blue-600'];
    __VLS_styleScopedClasses['text-gray-600'];
    __VLS_styleScopedClasses['bg-gradient-to-r'];
    __VLS_styleScopedClasses['from-indigo-600'];
    __VLS_styleScopedClasses['to-blue-600'];
    __VLS_styleScopedClasses['py-20'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['container'];
    __VLS_styleScopedClasses['mx-auto'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['text-3xl'];
    __VLS_styleScopedClasses['font-bold'];
    __VLS_styleScopedClasses['mb-6'];
    __VLS_styleScopedClasses['text-xl'];
    __VLS_styleScopedClasses['mb-8'];
    __VLS_styleScopedClasses['max-w-2xl'];
    __VLS_styleScopedClasses['mx-auto'];
    __VLS_styleScopedClasses['bg-white'];
    __VLS_styleScopedClasses['text-blue-600'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['px-8'];
    __VLS_styleScopedClasses['rounded-full'];
    __VLS_styleScopedClasses['hover:bg-blue-50'];
    __VLS_styleScopedClasses['transition'];
    __VLS_styleScopedClasses['duration-300'];
    __VLS_styleScopedClasses['shadow-lg'];
    __VLS_styleScopedClasses['py-20'];
    __VLS_styleScopedClasses['bg-gray-50'];
    __VLS_styleScopedClasses['container'];
    __VLS_styleScopedClasses['mx-auto'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['text-3xl'];
    __VLS_styleScopedClasses['font-bold'];
    __VLS_styleScopedClasses['mb-12'];
    __VLS_styleScopedClasses['text-gray-800'];
    __VLS_styleScopedClasses['text-xl'];
    __VLS_styleScopedClasses['italic'];
    __VLS_styleScopedClasses['text-gray-600'];
    __VLS_styleScopedClasses['max-w-3xl'];
    __VLS_styleScopedClasses['mx-auto'];
    __VLS_styleScopedClasses['mt-4'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['text-blue-600'];
    var __VLS_slots;
    var __VLS_inheritedAttrs;
    const __VLS_refs = {
        "heroSection": __VLS_nativeElements['section'],
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
            heroSection: heroSection,
            isHeroVisible: isHeroVisible,
            features: features,
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
