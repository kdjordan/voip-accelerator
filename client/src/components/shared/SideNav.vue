<template>
  <div class="relative">
    <nav
      :class="[
        'sidebar',
        'border-r border-muted fixed top-0 left-0 bottom-0',
        isOpen ? 'w-[200px]' : 'w-[80px]',
      ]"
    >
      <!-- Toggle button to close sidebar (visible only when sidebar is open) -->
      <button
        v-if="isOpen"
        @click="toggleSidebar"
        class="w-full flex items-center justify-end py-3 pr-3 hover:bg-fbHover/20"
      >
        <ArrowLeftEndOnRectangleIcon class="w-4 h-4 text-accent" />
      </button>

      <!-- Toggle button to open sidebar (visible only when sidebar is closed) -->
      <button
        v-if="!isOpen"
        @click="toggleSidebar"
        class="w-full flex items-center justify-center py-3 hover:bg-fbHover/20"
      >
        <ArrowRightStartOnRectangleIcon class="w-4 h-4 text-accent" />
      </button>

      <!-- Logo and App Name -->
      <div :class="['px-3 py-3 flex items-center', isOpen ? 'justify-start' : 'justify-center']">
        <RouterLink to="/home" class="flex items-center text-accent gap-2">
          <BoltIcon class="w-8 h-8 flex-shrink-0" />
          <span v-if="isOpen" class="font-medium text-accent whitespace-nowrap"
            >VOIP Accelerator</span
          >
        </RouterLink>
      </div>

      <ul class="flex-grow mt-4 font-secondary tracking-tight">
        <li v-for="(item, index) in items" :key="item.name" class="px-2 my-1 text-sizeSm">
          <!-- Top-level items -->
          <div v-if="!item.children">
            <RouterLink
              :to="item.to!"
              class="flex items-center py-2 px-3 rounded-md border transition-all overflow-hidden"
              :class="[
                isOpen ? 'space-x-2' : 'w-full justify-center',
                $route.path === item.to
                  ? 'bg-accent/20 border-accent/50'
                  : 'hover:bg-fbHover border-transparent',
              ]"
            >
              <component
                :is="item.icon"
                class="w-5 h-5 flex-shrink-0"
                :class="[$route.path === item.to ? 'text-accent' : 'text-fbWhite']"
              />
              <span
                v-if="isOpen"
                class="whitespace-nowrap"
                :class="[$route.path === item.to ? 'text-accent' : 'text-fbWhite']"
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
                isOpen ? 'justify-between' : 'justify-center',
                !isOpen && item.children?.some((child) => child.to === $route.path)
                  ? 'bg-accent/20 border-accent/50'
                  : 'hover:bg-fbHover border-transparent',
              ]"
            >
              <div class="flex items-center" :class="[isOpen ? 'space-x-2' : '']">
                <component
                  :is="item.icon"
                  class="w-5 h-5 flex-shrink-0"
                  :class="[
                    !isOpen && item.children?.some((child) => child.to === $route.path)
                      ? 'text-accent'
                      : 'text-fbWhite',
                  ]"
                />
                <span v-if="isOpen" class="whitespace-nowrap text-fbWhite">{{ item.name }}</span>
              </div>
              <ChevronDownIcon
                v-if="isOpen"
                :class="[
                  'w-4 h-4 text-fbWhite transition-transform',
                  expandedSections[index] ? 'rotate-180' : '',
                ]"
              />
            </button>
            <ul v-if="isOpen && expandedSections[index]" class="mt-1 ml-4 pl-2">
              <li v-for="child in item.children" :key="child.name" class="my-1">
                <RouterLink
                  v-if="child.to"
                  :to="child.to"
                  class="flex items-center py-1.5 px-3 rounded-md border transition-all"
                  :class="[
                    $route.path === child.to
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'hover:bg-fbHover/80 border-transparent text-fbWhite',
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
    </nav>

    <!-- This is the drag handle area -->
    <div
      class="ml-2 fixed top-0 bottom-0 w-[8px] hover:bg-fbHover transition-colors cursor-ew-resize"
      :style="{
        left: isOpen ? '194px' : '58px',
        transform: 'translateX(0)',
      }"
      @click="toggleSidebar"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useSharedStore } from '@/stores/shared-store';
import {
  ChevronDownIcon,
  ArrowLeftEndOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
  BoltIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  GlobeAmericasIcon,
  AdjustmentsVerticalIcon,
  HomeIcon,
  DocumentChartBarIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/vue/24/outline';

interface NavItem {
  name: string;
  to?: string;
  icon: any;
  children?: NavItem[];
}

const userStore = useSharedStore();
const isOpen = ref(userStore.getSideNavOpen);
const expandedSections = ref<Record<number, boolean>>({});

function toggleSidebar() {
  isOpen.value = !isOpen.value;
  userStore.setSideNavOpen(isOpen.value);
  if (!isOpen.value) {
    expandedSections.value = {};
  }
}

function toggleSection(index: number) {
  if (!isOpen.value) {
    toggleSidebar();
  }
  expandedSections.value[index] = !expandedSections.value[index];
}

const items = ref<NavItem[]>([
  {
    name: 'Dashboard',
    to: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Reporting',
    icon: DocumentChartBarIcon,
    children: [
      {
        name: 'US Reporting',
        to: '/usview',
        icon: GlobeAmericasIcon,
      },
      {
        name: 'AZ Reporting',
        to: '/azview',
        icon: GlobeAltIcon,
      },
    ],
  },
  {
    name: 'Rate Wizard',
    icon: WrenchScrewdriverIcon,
    children: [
      {
        name: 'US Rate Wizard',
        to: '/us-rate-sheet',
        icon: AdjustmentsVerticalIcon,
      },
      {
        name: 'AZ Rate Wizard',
        to: '/az-rate-sheet',
        icon: AdjustmentsVerticalIcon,
      },
    ],
  },
  {
    name: 'Lerg Admin',
    to: '/admin',
    icon: Cog6ToothIcon,
  },
]);
</script>
<style scoped>

.sidebar {
  display: flex;
  flex-direction: column;
  height: 100vh;
  transition: width 0.3s ease-in-out; /* Smoothed transition */
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 10;
  border-right: none; /* Ensure no double border */
  background-color: theme('colors.gray.900'); /* Corrected background color */
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
