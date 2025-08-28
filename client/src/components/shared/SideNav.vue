<template>
  <div class="hidden md:block relative">
    <nav
      :class="[
        'sidebar',
        'border-r border-muted fixed top-0 left-0 bottom-0 bg-neutral-900',
        userStore.ui.isSideNavOpen ? 'w-[200px]' : 'w-[80px]',
      ]"
    >
      <!-- Toggle button to close sidebar (visible only when sidebar is open) -->
      <button
        v-if="userStore.ui.isSideNavOpen"
        @click="userStore.toggleSideNav"
        class="w-full flex items-center justify-end py-3 pr-3 hover:bg-fbHover/20"
      >
        <ArrowLeftEndOnRectangleIcon class="w-4 h-4 text-accent" />
      </button>

      <!-- Toggle button to open sidebar (visible only when sidebar is closed) -->
      <button
        v-if="!userStore.ui.isSideNavOpen"
        @click="userStore.toggleSideNav"
        class="w-full flex items-center justify-center py-3 hover:bg-fbHover/20"
      >
        <ArrowRightStartOnRectangleIcon class="w-4 h-4 text-accent" />
      </button>

      <!-- Logo and App Name -->
      <div
        :class="[
          'px-3 py-3 flex items-center',
          userStore.ui.isSideNavOpen ? 'justify-start' : 'justify-center',
        ]"
      >
        <RouterLink to="/home" class="flex items-center text-accent gap-2">
          <VoipLogo />
          <span
            v-if="userStore.ui.isSideNavOpen"
            class="font-medium font-pt-mono text-accent whitespace-nowrap tracking-tighter"
            >VOIP Accelerator</span
          >
        </RouterLink>
      </div>

      <ul class="flex-grow mt-4 font-secondary tracking-tight">
        <li v-for="(item, index) in filteredNavigation" :key="item.name" class="px-2 my-1 text-sm">
          <!-- Top-level items -->
          <div v-if="!item.children">
            <RouterLink
              :to="item.href!"
              class="flex items-center py-2 px-3 rounded-md border transition-all overflow-hidden"
              :class="[
                userStore.ui.isSideNavOpen ? 'space-x-2' : 'w-full justify-center',
                route.path === item.href
                  ? 'bg-accent/20 border-accent/50'
                  : 'hover:bg-neutral-700 border-transparent',
              ]"
            >
              <component
                v-if="item.icon"
                :is="item.icon"
                class="w-5 h-5 flex-shrink-0"
                :class="[route.path === item.href ? 'text-accent' : 'text-neutral-300']"
              />
              <span
                v-if="userStore.ui.isSideNavOpen"
                class="whitespace-nowrap"
                :class="[route.path === item.href ? 'text-accent' : 'text-neutral-300']"
                >{{ item.name }}</span
              >
            </RouterLink>
          </div>

          <!-- Expandable sections -->
          <div v-else>
            <button
              @click="toggleSection(index)"
              class="flex items-center w-full py-2 px-3 rounded-md border transition-all"
              :class="[
                userStore.ui.isSideNavOpen ? 'justify-between' : 'justify-center',
                !userStore.ui.isSideNavOpen &&
                item.children?.some((child: NavigationItem) => child.href === route.path)
                  ? 'bg-accent/20 border-accent/50'
                  : 'hover:bg-neutral-700 border-transparent',
              ]"
            >
              <div
                class="flex items-center"
                :class="[userStore.ui.isSideNavOpen ? 'space-x-2' : '']"
              >
                <component
                  v-if="item.icon"
                  :is="item.icon"
                  class="w-5 h-5 flex-shrink-0"
                  :class="[
                    !userStore.ui.isSideNavOpen &&
                    item.children?.some((child: NavigationItem) => child.href === route.path)
                      ? 'text-accent'
                      : 'text-neutral-300',
                  ]"
                />
                <span
                  v-if="userStore.ui.isSideNavOpen"
                  class="whitespace-nowrap text-neutral-300"
                  >{{ item.name }}</span
                >
              </div>
              <ChevronDownIcon
                v-if="userStore.ui.isSideNavOpen"
                :class="[
                  'w-4 h-4 text-neutral-300 transition-transform',
                  expandedSections[index] ? 'rotate-180' : '',
                ]"
              />
            </button>
            <ul v-if="userStore.ui.isSideNavOpen && expandedSections[index]" class="mt-1 ml-4 pl-2">
              <li v-for="child in item.children" :key="child.name" class="my-1">
                <RouterLink
                  v-if="child.href"
                  :to="child.href"
                  class="flex items-center py-1.5 px-3 rounded-md border transition-all"
                  :class="[
                    route.path === child.href
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'hover:bg-neutral-700/80 border-transparent text-neutral-300',
                  ]"
                >
                  <span class="whitespace-nowrap text-xs">{{ child.name }}</span>
                </RouterLink>
              </li>
            </ul>
          </div>
        </li>
      </ul>

      <!-- User Dropdown -->
      <div class="mt-auto p-3"></div>
    </nav>

    <!-- This is the drag handle area -->
    <div
      class="ml-2 fixed top-0 bottom-0 w-[8px] hover:bg-fbHover transition-colors cursor-ew-resize"
      :style="{
        left: userStore.ui.isSideNavOpen ? '194px' : '58px',
        transform: 'translateX(0)',
      }"
      @click="userStore.toggleSideNav"
    ></div>
  </div>
</template>

<script setup lang="ts">
  import { RouterLink, useRoute, useRouter } from 'vue-router';
  import { ref, computed } from 'vue';
  import { useUserStore } from '@/stores/user-store';
  import {
    ChevronDownIcon,
    ArrowLeftEndOnRectangleIcon,
    ArrowRightStartOnRectangleIcon,
    ArrowRightOnRectangleIcon,
    ArrowLeftOnRectangleIcon,
    BoltIcon,
  } from '@heroicons/vue/24/outline';
  import { appNavigationItems } from '@/constants/navigation';
  import type { NavigationItem } from '@/types/nav-types';
  import VoipLogo from './VoipLogo.vue';

  const userStore = useUserStore();
  const route = useRoute();
  const router = useRouter();

  // Corrected: Use getter for isAuthenticated
  const isAuthenticated = computed(() => userStore.getIsAuthenticated);
  // Access profile via auth state and use store getters
  const isAdmin = computed(() => userStore.isAdmin);
  const isSuperAdmin = computed(() => userStore.isSuperAdmin);
  const isEnterpriseAdmin = computed(() => userStore.isEnterpriseAdmin);

  const props = defineProps<{ navigation: NavigationItem[] }>();

  // Filter navigation based on auth state and roles
  const filteredNavigation = computed(() => {
    return props.navigation.filter((item) => {
      // Added optional chaining for meta, matching updated type
      const requiresAuth = item.meta?.requiresAuth;
      const requiresAdmin = item.meta?.requiresAdmin;
      const requiresSuperAdmin = item.meta?.requiresSuperAdmin;
      const hideWhenAuthed = item.meta?.hideWhenAuthed;

      if (hideWhenAuthed && isAuthenticated.value) return false;
      if (requiresAuth && !isAuthenticated.value) return false;
      if (requiresSuperAdmin && !isSuperAdmin.value) return false;
      if (requiresAdmin && !isAdmin.value) return false;

      // Filter children recursively if needed
      if (item.children) {
        item.children = item.children.filter((child) => {
          const childRequiresAuth = child.meta?.requiresAuth;
          const childRequiresAdmin = child.meta?.requiresAdmin;
          const childRequiresSuperAdmin = child.meta?.requiresSuperAdmin;
          const childHideWhenAuthed = child.meta?.hideWhenAuthed;

          if (childHideWhenAuthed && isAuthenticated.value) return false;
          if (childRequiresAuth && !isAuthenticated.value) return false;
          if (childRequiresSuperAdmin && !isSuperAdmin.value) return false;
          if (childRequiresAdmin && !isAdmin.value) return false;
          return true;
        });
        // Hide parent if all children are filtered out
        return item.children.length > 0;
      }

      return true;
    });
  });

  const expandedSections = ref<Record<number, boolean>>({});

  function toggleSection(index: number): void {
    expandedSections.value[index] = !expandedSections.value[index];

    // If the sidebar is currently closed, open it when expanding a section
    if (!userStore.ui.isSideNavOpen) {
      userStore.toggleSideNav();
    }
  }
</script>

<style scoped>
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100vh;
    transition: width 0.3s ease-in-out;
    overflow-y: auto;
    overflow-x: hidden;
    z-index: 30;
    border-right: none;
    background-color: theme('colors.gray.900');
  }

  /* Style adjustments for better visual hierarchy */
  ul ul {
    /* Indentation and styling for child items */
    padding-left: 0.5rem; /* Adjust as needed */
  }

  /* Ensure icons and text align nicely */
  .flex.items-center {
    min-height: 2rem; /* Ensure consistent height for clickable areas */
  }
</style>
