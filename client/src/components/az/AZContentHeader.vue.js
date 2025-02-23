import { useAzStore } from '@/stores/az-store';
import { ReportTypes } from '@/types';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types';
import { computed } from 'vue';
import { AZ_JOURNEY_MESSAGES, JOURNEY_STATE } from '@/constants/messages';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const azStore = useAzStore();
const { deleteDatabase } = useDexieDB();
const reportTypes = [ReportTypes.FILES, ReportTypes.CODE, ReportTypes.PRICING];
const currentJourneyState = computed(() => {
    if (azStore.reportsGenerated) {
        return JOURNEY_STATE.REPORTS_READY;
    }
    const uploadedCount = azStore.getNumberOfFilesUploaded;
    switch (uploadedCount) {
        case 0:
            return JOURNEY_STATE.INITIAL;
        case 1:
            return JOURNEY_STATE.ONE_FILE;
        case 2:
            return JOURNEY_STATE.TWO_FILES;
        default:
            return JOURNEY_STATE.INITIAL;
    }
});
const journeyMessage = computed(() => {
    return AZ_JOURNEY_MESSAGES[currentJourneyState.value];
});
async function handleReset() {
    try {
        console.log('Resetting the AZ report');
        // Get current file names before resetting store
        const fileNames = azStore.getFileNames;
        console.log('Cleaning up stores:', fileNames);
        // Reset store state
        azStore.resetFiles();
        azStore.setActiveReportType('files');
        // Clean up Dexie stores using actual file names
        if (fileNames.length > 0) {
            await Promise.all(fileNames.map(fileName => deleteDatabase(DBName.AZ)));
        }
        console.log('Reset completed successfully');
    }
    catch (error) {
        console.error('Error during reset:', error);
    }
}
// Log on component mount
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
    // CSS variable injection 
    // CSS variable injection end 
    let __VLS_resolvedLocalAndGlobalComponents;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("w-full") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("bg-gray-800 rounded-t-lg p-6") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("pb-4") }, });
    const __VLS_0 = __VLS_resolvedLocalAndGlobalComponents.Transition;
    /** @type { [typeof __VLS_components.Transition, typeof __VLS_components.Transition, ] } */
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({ name: ("fade"), mode: ("out-in"), }));
    const __VLS_2 = __VLS_1({ name: ("fade"), mode: ("out-in"), }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ key: ((__VLS_ctx.currentJourneyState)), ...{ class: ("min-h-24") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({ ...{ class: ("text-sizeLg tracking-wide text-white mb-2") }, });
    (__VLS_ctx.journeyMessage.title);
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-base text-gray-400") }, });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, modifiers: {}, value: (__VLS_ctx.journeyMessage.message) }, null, null);
    __VLS_nonNullable(__VLS_5.slots).default;
    var __VLS_5;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("border-b border-gray-700/50 mx-2") }, });
    if (__VLS_ctx.azStore.reportsGenerated) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("bg-gray-800 px-6 pb-6") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center border-b border-gray-700") }, });
        for (const [type] of __VLS_getVForSourceType((__VLS_ctx.reportTypes))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                        if (!((__VLS_ctx.azStore.reportsGenerated)))
                            return;
                        __VLS_ctx.azStore.setActiveReportType(type);
                    } }, key: ((type)), ...{ class: ("mr-8 py-4 px-1 relative") }, ...{ class: (([
                        'hover:text-white transition-colors',
                        {
                            'text-white': __VLS_ctx.azStore.activeReportType === type,
                            'text-gray-400': __VLS_ctx.azStore.activeReportType !== type,
                        },
                    ])) }, });
            if (type !== 'files') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (type.charAt(0).toUpperCase() + type.slice(1));
            }
            else {
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (type.charAt(0).toUpperCase() + type.slice(1));
            }
            if (__VLS_ctx.azStore.activeReportType === type) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500") }, });
            }
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.handleReset) }, ...{ class: ("px-4 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded-md transition-colors ml-auto text-red-400") }, });
    }
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['bg-gray-800'];
    __VLS_styleScopedClasses['rounded-t-lg'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['pb-4'];
    __VLS_styleScopedClasses['min-h-24'];
    __VLS_styleScopedClasses['text-sizeLg'];
    __VLS_styleScopedClasses['tracking-wide'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['mb-2'];
    __VLS_styleScopedClasses['text-base'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700/50'];
    __VLS_styleScopedClasses['mx-2'];
    __VLS_styleScopedClasses['bg-gray-800'];
    __VLS_styleScopedClasses['px-6'];
    __VLS_styleScopedClasses['pb-6'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['border-b'];
    __VLS_styleScopedClasses['border-gray-700'];
    __VLS_styleScopedClasses['mr-8'];
    __VLS_styleScopedClasses['py-4'];
    __VLS_styleScopedClasses['px-1'];
    __VLS_styleScopedClasses['relative'];
    __VLS_styleScopedClasses['hover:text-white'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['absolute'];
    __VLS_styleScopedClasses['bottom-0'];
    __VLS_styleScopedClasses['left-0'];
    __VLS_styleScopedClasses['right-0'];
    __VLS_styleScopedClasses['h-0.5'];
    __VLS_styleScopedClasses['bg-emerald-500'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['py-1.5'];
    __VLS_styleScopedClasses['bg-red-950'];
    __VLS_styleScopedClasses['hover:bg-red-900'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-red-500/50'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['ml-auto'];
    __VLS_styleScopedClasses['text-red-400'];
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
            azStore: azStore,
            reportTypes: reportTypes,
            currentJourneyState: currentJourneyState,
            journeyMessage: journeyMessage,
            handleReset: handleReset,
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
