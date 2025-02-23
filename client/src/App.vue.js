import SideNav from '@/components/shared/SideNav.vue';
import TheFooter from '@/components/shared/TheFooter.vue';
import { onMounted, onBeforeUnmount } from 'vue';
import { DBName } from '@/types/app-types';
import { useSharedStore } from '@/stores/shared-store';
import { cleanupDatabases } from '@/utils/cleanup';
import { loadSampleDecks } from '@/utils/load-sample-data';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const sharedStore = useSharedStore();
let isCleaningUp = false;
const handleBeforeUnload = async (event) => {
    if (isCleaningUp)
        return;
    isCleaningUp = true;
    // Show "Changes you made may not be saved" dialog
    event.preventDefault();
    event.returnValue = '';
    try {
        await cleanupDatabases();
    }
    finally {
        isCleaningUp = false;
    }
};
const handlePageHide = async () => {
    if (isCleaningUp)
        return;
    isCleaningUp = true;
    try {
        await cleanupDatabases();
    }
    finally {
        isCleaningUp = false;
    }
};
onMounted(async () => {
    window.addEventListener('pagehide', handlePageHide);
    // Keep beforeunload for page refreshes
    window.addEventListener('beforeunload', handleBeforeUnload);
    try {
        console.log('Starting application initialization...');
        // console.log('Loading sample decks...');
        await loadSampleDecks([DBName.AZ]);
    }
    catch (error) {
        console.error('Error during initialization:', error);
    }
});
onBeforeUnmount(() => {
    window.removeEventListener('pagehide', handlePageHide);
    window.removeEventListener('beforeunload', handleBeforeUnload);
});
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ id: ("app"), ...{ class: ("flex min-h-screen bg-fbBlack text-fbWhite font-sans") }, });
    // @ts-ignore
    [SideNav,];
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(SideNav, new SideNav({ ...{ class: ("z-20") }, }));
    const __VLS_1 = __VLS_0({ ...{ class: ("z-20") }, }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex-1 flex flex-col transition-all duration-300") }, ...{ class: (([__VLS_ctx.sharedStore.getSideNavOpen ? 'ml-[200px]' : 'ml-[64px]'])) }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({ ...{ class: ("flex-1") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("min-h-full flex justify-center w-full max-w-6xl mx-auto mt-10") }, });
    const __VLS_5 = __VLS_resolvedLocalAndGlobalComponents.RouterView;
    /** @type { [typeof __VLS_components.RouterView, typeof __VLS_components.routerView, typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ] } */
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({}));
    const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
    {
        const { default: __VLS_thisSlot } = __VLS_nonNullable(__VLS_10.slots);
        const [{ Component }] = __VLS_getSlotParams(__VLS_thisSlot);
        const __VLS_11 = __VLS_resolvedLocalAndGlobalComponents.transition;
        /** @type { [typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ] } */
        // @ts-ignore
        const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({ name: ("fade"), mode: ("out-in"), appear: (true), }));
        const __VLS_13 = __VLS_12({ name: ("fade"), mode: ("out-in"), appear: (true), }, ...__VLS_functionalComponentArgsRest(__VLS_12));
        const __VLS_17 = ((Component));
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({}));
        const __VLS_19 = __VLS_18({}, ...__VLS_functionalComponentArgsRest(__VLS_18));
        __VLS_nonNullable(__VLS_16.slots).default;
        var __VLS_16;
        __VLS_nonNullable(__VLS_10.slots)['' /* empty slot name completion */];
    }
    var __VLS_10;
    // @ts-ignore
    [TheFooter,];
    // @ts-ignore
    const __VLS_23 = __VLS_asFunctionalComponent(TheFooter, new TheFooter({}));
    const __VLS_24 = __VLS_23({}, ...__VLS_functionalComponentArgsRest(__VLS_23));
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['min-h-screen'];
    __VLS_styleScopedClasses['bg-fbBlack'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['font-sans'];
    __VLS_styleScopedClasses['z-20'];
    __VLS_styleScopedClasses['flex-1'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['flex-col'];
    __VLS_styleScopedClasses['transition-all'];
    __VLS_styleScopedClasses['duration-300'];
    __VLS_styleScopedClasses['flex-1'];
    __VLS_styleScopedClasses['min-h-full'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['max-w-6xl'];
    __VLS_styleScopedClasses['mx-auto'];
    __VLS_styleScopedClasses['mt-10'];
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
            SideNav: SideNav,
            TheFooter: TheFooter,
            sharedStore: sharedStore,
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
