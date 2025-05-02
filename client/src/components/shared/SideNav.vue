<template>
  <div class="hidden md:block relative">
    <nav
      :class="[
        'sidebar',
        'border-r border-muted fixed top-0 left-0 bottom-0 bg-neutral-900',
        userStore.getSideNavOpen ? 'w-[200px]' : 'w-[80px]',
      ]"
    >
      <!-- Toggle button to close sidebar (visible only when sidebar is open) -->
      <button
        v-if="userStore.getSideNavOpen"
        @click="userStore.toggleSideNav"
        class="w-full flex items-center justify-end py-3 pr-3 hover:bg-fbHover/20"
      >
        <ArrowLeftEndOnRectangleIcon class="w-4 h-4 text-accent" />
      </button>

      <!-- Toggle button to open sidebar (visible only when sidebar is closed) -->
      <button
        v-if="!userStore.getSideNavOpen"
        @click="userStore.toggleSideNav"
        class="w-full flex items-center justify-center py-3 hover:bg-fbHover/20"
      >
        <ArrowRightStartOnRectangleIcon class="w-4 h-4 text-accent" />
      </button>

      <!-- Logo and App Name -->
      <div
        :class="[
          'px-3 py-3 flex items-center',
          userStore.getSideNavOpen ? 'justify-start' : 'justify-center',
        ]"
      >
        <RouterLink to="/home" class="flex items-center text-accent gap-2">
          <BoltIcon class="w-8 h-8 flex-shrink-0" />
          <span
            v-if="userStore.getSideNavOpen"
            class="font-medium font-secondary text-accent whitespace-nowrap tracking-tighter"
            >VoIP Accelerator</span
          >
        </RouterLink>
      </div>

      <ul class="flex-grow mt-4 font-secondary tracking-tight">
        <li v-for="(item, index) in items" :key="item.name" class="px-2 my-1 text-sm">
          <!-- Top-level items -->
          <div v-if="!item.children">
            <RouterLink
              :to="item.href!"
              class="flex items-center py-2 px-3 rounded-md border transition-all overflow-hidden"
              :class="[
                userStore.getSideNavOpen ? 'space-x-2' : 'w-full justify-center',
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
                v-if="userStore.getSideNavOpen"
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
                userStore.getSideNavOpen ? 'justify-between' : 'justify-center',
                !userStore.getSideNavOpen &&
                item.children?.some((child) => child.href === route.path)
                  ? 'bg-accent/20 border-accent/50'
                  : 'hover:bg-neutral-700 border-transparent',
              ]"
            >
              <div class="flex items-center" :class="[userStore.getSideNavOpen ? 'space-x-2' : '']">
                <component
                  v-if="item.icon"
                  :is="item.icon"
                  class="w-5 h-5 flex-shrink-0"
                  :class="[
                    !userStore.getSideNavOpen &&
                    item.children?.some((child) => child.href === route.path)
                      ? 'text-accent'
                      : 'text-neutral-300',
                  ]"
                />
                <span v-if="userStore.getSideNavOpen" class="whitespace-nowrap text-neutral-300">{{
                  item.name
                }}</span>
              </div>
              <ChevronDownIcon
                v-if="userStore.getSideNavOpen"
                :class="[
                  'w-4 h-4 text-neutral-300 transition-transform',
                  expandedSections[index] ? 'rotate-180' : '',
                ]"
              />
            </button>
            <ul v-if="userStore.getSideNavOpen && expandedSections[index]" class="mt-1 ml-4 pl-2">
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
      <div class="mt-auto p-4">
        <!-- Content for user dropdown -->
      </div>
    </nav>

    <!-- This is the drag handle area -->
    <div
      class="ml-2 fixed top-0 bottom-0 w-[8px] hover:bg-fbHover transition-colors cursor-ew-resize"
      :style="{
        left: userStore.getSideNavOpen ? '194px' : '58px',
        transform: 'translateX(0)',
      }"
      @click="userStore.toggleSideNav"
    ></div>
  </div>
</template>

<script setup lang="ts">
  import { RouterLink, useRoute } from 'vue-router';
  import { ref } from 'vue';
  import { useSharedStore } from '@/stores/shared-store';
  import {
    ChevronDownIcon,
    ArrowLeftEndOnRectangleIcon,
    ArrowRightStartOnRectangleIcon,
    BoltIcon,
  } from '@heroicons/vue/24/outline';
  import { appNavigationItems } from '@/constants/navigation';
  import type { NavigationItem } from '@/types/nav-types';

  const userStore = useSharedStore();
  const route = useRoute();
  const expandedSections = ref<Record<number, boolean>>({});

  const items = ref<NavigationItem[]>(appNavigationItems);

  function toggleSection(index: number) {
    if (!userStore.getSideNavOpen) {
      userStore.toggleSideNav();
    }
    expandedSections.value[index] = !expandedSections.value[index];
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
    z-index: 10;
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
