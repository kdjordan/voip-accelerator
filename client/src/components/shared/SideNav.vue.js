import { RouterLink } from 'vue-router';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useSharedStore } from '@/stores/shared-store';
import { PlanTier } from '@/types/user-types';
import { DocumentCurrencyDollarIcon, BarsArrowDownIcon, PercentBadgeIcon, ChevronLeftIcon, ChevronUpDownIcon, BoltIcon, CreditCardIcon, ArrowRightEndOnRectangleIcon, Cog6ToothIcon, CurrencyDollarIcon, } from '@heroicons/vue/24/outline';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const userStore = useSharedStore();
const isOpen = ref(userStore.getSideNavOpen);
const dropdownRef = ref(null);
const dropdownOpen = ref(false);
function toggleSidebar() {
    isOpen.value = !isOpen.value;
    userStore.setSideNavOpen(isOpen.value);
}
function toggleDropdown(event) {
    event.stopPropagation();
    dropdownOpen.value = !dropdownOpen.value;
}
function handleClickOutside(event) {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
        dropdownOpen.value = false;
    }
}
const items = ref([
    {
        name: 'AZ Reporting',
        to: '/azview',
        icon: DocumentCurrencyDollarIcon,
    },
    {
        name: 'US Reporting',
        to: '/usview',
        icon: DocumentCurrencyDollarIcon,
    },
    {
        name: 'Rate Sheet',
        to: '/rate-sheet',
        icon: CurrencyDollarIcon,
    },
    {
        name: 'Lerg Admin',
        to: '/admin/lerg',
        icon: Cog6ToothIcon,
    },
]);
const dropdownItems = ref([
    {
        label: 'Profile',
        icon: DocumentCurrencyDollarIcon,
    },
    {
        label: 'Settings',
        icon: BarsArrowDownIcon,
    },
    {
        label: 'Logout',
        icon: PercentBadgeIcon,
    },
]);
onMounted(() => {
    document.body.addEventListener('click', handleClickOutside);
});
onBeforeUnmount(() => {
    document.body.removeEventListener('click', handleClickOutside);
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("relative") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({ ...{ class: ((['sidebar', 'border-r border-muted fixed top-0 left-0 bottom-0', __VLS_ctx.isOpen ? 'w-[200px]' : 'w-[64px]'])) }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({ ...{ class: ("text-center py-2 mb-4") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center text-accent px-4 mb-0") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-3xl") }, });
    const __VLS_0 = __VLS_resolvedLocalAndGlobalComponents.BoltIcon;
    /** @type { [typeof __VLS_components.BoltIcon, ] } */
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({ ...{ class: ("w-8 h-8 -ml-1 flex-shrink-0") }, }));
    const __VLS_2 = __VLS_1({ ...{ class: ("w-8 h-8 -ml-1 flex-shrink-0") }, }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({ ...{ class: ("flex-grow") }, });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.items))) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({ key: ((item.name)), ...{ class: ("px-2 my-1 text-sizeSm") }, });
        const __VLS_6 = __VLS_resolvedLocalAndGlobalComponents.RouterLink;
        /** @type { [typeof __VLS_components.RouterLink, typeof __VLS_components.RouterLink, ] } */
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({ to: ((item.to)), ...{ class: ("flex items-center py-2 px-3 rounded-md transition-colors hover:bg-fbHover overflow-hidden") }, ...{ class: (([__VLS_ctx.isOpen ? 'space-x-2' : 'justify-center', { 'bg-fbHover': __VLS_ctx.$route.path === item.to }])) }, }));
        const __VLS_8 = __VLS_7({ to: ((item.to)), ...{ class: ("flex items-center py-2 px-3 rounded-md transition-colors hover:bg-fbHover overflow-hidden") }, ...{ class: (([__VLS_ctx.isOpen ? 'space-x-2' : 'justify-center', { 'bg-fbHover': __VLS_ctx.$route.path === item.to }])) }, }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        const __VLS_12 = ((item.icon));
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({ ...{ class: ("w-5 h-5 text-fbWhite flex-shrink-0") }, }));
        const __VLS_14 = __VLS_13({ ...{ class: ("w-5 h-5 text-fbWhite flex-shrink-0") }, }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        if (__VLS_ctx.isOpen) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-fbWhite whitespace-nowrap") }, });
            (item.name);
        }
        __VLS_nonNullable(__VLS_11.slots).default;
        var __VLS_11;
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("px-2") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.toggleSidebar) }, ...{ class: ("flex items-center justify-center h-8 w-8 rounded-md border border-fbBorder hover:bg-fbHover transition-all") }, ...{ class: (([__VLS_ctx.isOpen ? 'ml-auto' : 'mx-auto'])) }, });
    const __VLS_18 = __VLS_resolvedLocalAndGlobalComponents.ChevronLeftIcon;
    /** @type { [typeof __VLS_components.ChevronLeftIcon, ] } */
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({ ...{ class: ("w-5 h-5 text-fbWhite transition-transform") }, ...{ class: (({ 'rotate-180': !__VLS_ctx.isOpen })) }, }));
    const __VLS_20 = __VLS_19({ ...{ class: ("w-5 h-5 text-fbWhite transition-transform") }, ...{ class: (({ 'rotate-180': !__VLS_ctx.isOpen })) }, }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("p-4 relative") }, });
    if (__VLS_ctx.dropdownOpen) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ref: ("dropdownRef"), ...{ class: ("dropdown fixed bottom-[72px] left-4 w-[240px] p-2 bg-fbBlack border border-fbBorder/70 rounded-lg z-50") }, });
        // @ts-ignore navigation for `const dropdownRef = ref()`
        __VLS_ctx.dropdownRef;
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("px-3 py-2 text-sm text-fbLightMuted") }, });
        (__VLS_ctx.userStore.userEmail);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("px-3 py-2 flex items-center space-x-3") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("w-8 h-8 rounded-md bg-gradient-to-br from-fbGreen/90 to-fbGray/80") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-sizeSm") }, });
        (__VLS_ctx.userStore.username);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-xs text-fbLightMuted") }, });
        (__VLS_ctx.userStore.currentPlan);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("border-t border-fbBorder my-2") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ class: ("w-full text-left px-3 py-2 hover:bg-fbHover rounded-md flex items-center space-x-2") }, });
        const __VLS_24 = __VLS_resolvedLocalAndGlobalComponents.CreditCardIcon;
        /** @type { [typeof __VLS_components.CreditCardIcon, ] } */
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({ ...{ class: ("w-4 h-4 text-foreground") }, }));
        const __VLS_26 = __VLS_25({ ...{ class: ("w-4 h-4 text-foreground") }, }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ class: ("w-full text-left px-3 py-2 hover:bg-fbHover rounded-md flex items-center space-x-2") }, });
        const __VLS_30 = __VLS_resolvedLocalAndGlobalComponents.ArrowRightEndOnRectangleIcon;
        /** @type { [typeof __VLS_components.ArrowRightEndOnRectangleIcon, ] } */
        // @ts-ignore
        const __VLS_31 = __VLS_asFunctionalComponent(__VLS_30, new __VLS_30({ ...{ class: ("w-4 h-4 text-fbWhite") }, }));
        const __VLS_32 = __VLS_31({ ...{ class: ("w-4 h-4 text-fbWhite") }, }, ...__VLS_functionalComponentArgsRest(__VLS_31));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("border-t border-fbBorder my-2") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ class: ("w-full text-left px-3 py-2 hover:bg-fbHover rounded-md") }, });
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("px-2 flex justify-center") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.toggleDropdown) }, ...{ onClick: () => { } }, ...{ class: ("flex items-center hover:bg-fbHover rounded-md transition-all overflow-hidden min-w-[32px] min-h-[32px] p-0") }, ...{ class: (([__VLS_ctx.isOpen ? 'w-full p-2 space-x-3' : 'w-8 h-8'])) }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("h-8 w-8 rounded-md bg-gradient-to-br from-accent/80 to-fbBlack flex-shrink-0") }, });
    if (__VLS_ctx.isOpen) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex-grow text-left") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-sm text-fbWhite whitespace-nowrap") }, });
        (__VLS_ctx.userStore.username);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("text-xs text-muted-foreground whitespace-nowrap") }, });
        (__VLS_ctx.userStore.currentPlan === __VLS_ctx.PlanTier.PRO ? 'Pro' : 'Free');
    }
    if (__VLS_ctx.isOpen) {
        const __VLS_36 = __VLS_resolvedLocalAndGlobalComponents.ChevronUpDownIcon;
        /** @type { [typeof __VLS_components.ChevronUpDownIcon, ] } */
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({ ...{ class: ("w-4 h-4 text-muted-foreground") }, }));
        const __VLS_38 = __VLS_37({ ...{ class: ("w-4 h-4 text-muted-foreground") }, }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onClick: (__VLS_ctx.toggleSidebar) }, ...{ class: ("ml-2 fixed top-0 bottom-0 w-[8px] hover:bg-fbHover transition-colors cursor-ew-resize") }, ...{ style: (({
                left: __VLS_ctx.isOpen ? '194px' : '58px' /* Adjusted further left to keep centered on border */,
                transform: 'translateX(0)',
            })) }, });
    __VLS_styleScopedClasses['relative'];
    __VLS_styleScopedClasses['sidebar'];
    __VLS_styleScopedClasses['border-r'];
    __VLS_styleScopedClasses['border-muted'];
    __VLS_styleScopedClasses['fixed'];
    __VLS_styleScopedClasses['top-0'];
    __VLS_styleScopedClasses['left-0'];
    __VLS_styleScopedClasses['bottom-0'];
    __VLS_styleScopedClasses['text-center'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['text-accent'];
    __VLS_styleScopedClasses['px-4'];
    __VLS_styleScopedClasses['mb-0'];
    __VLS_styleScopedClasses['text-3xl'];
    __VLS_styleScopedClasses['w-8'];
    __VLS_styleScopedClasses['h-8'];
    __VLS_styleScopedClasses['-ml-1'];
    __VLS_styleScopedClasses['flex-shrink-0'];
    __VLS_styleScopedClasses['flex-grow'];
    __VLS_styleScopedClasses['px-2'];
    __VLS_styleScopedClasses['my-1'];
    __VLS_styleScopedClasses['text-sizeSm'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['hover:bg-fbHover'];
    __VLS_styleScopedClasses['overflow-hidden'];
    __VLS_styleScopedClasses['bg-fbHover'];
    __VLS_styleScopedClasses['w-5'];
    __VLS_styleScopedClasses['h-5'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['flex-shrink-0'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['whitespace-nowrap'];
    __VLS_styleScopedClasses['px-2'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['h-8'];
    __VLS_styleScopedClasses['w-8'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-fbBorder'];
    __VLS_styleScopedClasses['hover:bg-fbHover'];
    __VLS_styleScopedClasses['transition-all'];
    __VLS_styleScopedClasses['w-5'];
    __VLS_styleScopedClasses['h-5'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['transition-transform'];
    __VLS_styleScopedClasses['rotate-180'];
    __VLS_styleScopedClasses['p-4'];
    __VLS_styleScopedClasses['relative'];
    __VLS_styleScopedClasses['dropdown'];
    __VLS_styleScopedClasses['fixed'];
    __VLS_styleScopedClasses['bottom-[72px]'];
    __VLS_styleScopedClasses['left-4'];
    __VLS_styleScopedClasses['w-[240px]'];
    __VLS_styleScopedClasses['p-2'];
    __VLS_styleScopedClasses['bg-fbBlack'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-fbBorder/70'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['z-50'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-fbLightMuted'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['space-x-3'];
    __VLS_styleScopedClasses['w-8'];
    __VLS_styleScopedClasses['h-8'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['bg-gradient-to-br'];
    __VLS_styleScopedClasses['from-fbGreen/90'];
    __VLS_styleScopedClasses['to-fbGray/80'];
    __VLS_styleScopedClasses['text-sizeSm'];
    __VLS_styleScopedClasses['text-xs'];
    __VLS_styleScopedClasses['text-fbLightMuted'];
    __VLS_styleScopedClasses['border-t'];
    __VLS_styleScopedClasses['border-fbBorder'];
    __VLS_styleScopedClasses['my-2'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['hover:bg-fbHover'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['space-x-2'];
    __VLS_styleScopedClasses['w-4'];
    __VLS_styleScopedClasses['h-4'];
    __VLS_styleScopedClasses['text-foreground'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['hover:bg-fbHover'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['space-x-2'];
    __VLS_styleScopedClasses['w-4'];
    __VLS_styleScopedClasses['h-4'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['border-t'];
    __VLS_styleScopedClasses['border-fbBorder'];
    __VLS_styleScopedClasses['my-2'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['px-3'];
    __VLS_styleScopedClasses['py-2'];
    __VLS_styleScopedClasses['hover:bg-fbHover'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['px-2'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['hover:bg-fbHover'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['transition-all'];
    __VLS_styleScopedClasses['overflow-hidden'];
    __VLS_styleScopedClasses['min-w-[32px]'];
    __VLS_styleScopedClasses['min-h-[32px]'];
    __VLS_styleScopedClasses['p-0'];
    __VLS_styleScopedClasses['h-8'];
    __VLS_styleScopedClasses['w-8'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['bg-gradient-to-br'];
    __VLS_styleScopedClasses['from-accent/80'];
    __VLS_styleScopedClasses['to-fbBlack'];
    __VLS_styleScopedClasses['flex-shrink-0'];
    __VLS_styleScopedClasses['flex-grow'];
    __VLS_styleScopedClasses['text-left'];
    __VLS_styleScopedClasses['text-sm'];
    __VLS_styleScopedClasses['text-fbWhite'];
    __VLS_styleScopedClasses['whitespace-nowrap'];
    __VLS_styleScopedClasses['text-xs'];
    __VLS_styleScopedClasses['text-muted-foreground'];
    __VLS_styleScopedClasses['whitespace-nowrap'];
    __VLS_styleScopedClasses['w-4'];
    __VLS_styleScopedClasses['h-4'];
    __VLS_styleScopedClasses['text-muted-foreground'];
    __VLS_styleScopedClasses['ml-2'];
    __VLS_styleScopedClasses['fixed'];
    __VLS_styleScopedClasses['top-0'];
    __VLS_styleScopedClasses['bottom-0'];
    __VLS_styleScopedClasses['w-[8px]'];
    __VLS_styleScopedClasses['hover:bg-fbHover'];
    __VLS_styleScopedClasses['transition-colors'];
    __VLS_styleScopedClasses['cursor-ew-resize'];
    var __VLS_slots;
    var __VLS_inheritedAttrs;
    const __VLS_refs = {
        "dropdownRef": __VLS_nativeElements['div'],
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
            RouterLink: RouterLink,
            PlanTier: PlanTier,
            ChevronLeftIcon: ChevronLeftIcon,
            ChevronUpDownIcon: ChevronUpDownIcon,
            BoltIcon: BoltIcon,
            CreditCardIcon: CreditCardIcon,
            ArrowRightEndOnRectangleIcon: ArrowRightEndOnRectangleIcon,
            userStore: userStore,
            isOpen: isOpen,
            dropdownRef: dropdownRef,
            dropdownOpen: dropdownOpen,
            toggleSidebar: toggleSidebar,
            toggleDropdown: toggleDropdown,
            items: items,
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
