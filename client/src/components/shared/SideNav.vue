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
        <li v-for="item in items" :key="item.name" class="px-2 my-1 text-sizeSm">
          <RouterLink
            :to="item.to"
            class="flex items-center py-2 px-3 rounded-md border transition-all overflow-hidden"
            :class="[
              isOpen ? 'space-x-2' : 'justify-center',
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
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useSharedStore } from '@/stores/shared-store';
import { PlanTier } from '@/types/user-types';
import {
  ChevronLeftIcon,
  ArrowLeftEndOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
  BoltIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  GlobeAmericasIcon,
  AdjustmentsVerticalIcon,
  HomeIcon,
} from '@heroicons/vue/24/outline';

const userStore = useSharedStore();
const isOpen = ref(userStore.getSideNavOpen);
const dropdownRef = ref<HTMLElement | null>(null);
const dropdownOpen = ref(false);

function toggleSidebar() {
  isOpen.value = !isOpen.value;
  userStore.setSideNavOpen(isOpen.value);
}

function toggleDropdown(event: MouseEvent) {
  event.stopPropagation();
  dropdownOpen.value = !dropdownOpen.value;
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    dropdownOpen.value = false;
  }
}

const items = ref([
  {
    name: 'Dashboard',
    to: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'AZ Reporting',
    to: '/azview',
    icon: GlobeAltIcon,
  },
  {
    name: 'US Reporting',
    to: '/usview',
    icon: GlobeAmericasIcon,
  },
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
  {
    name: 'Lerg Admin',
    to: '/admin',
    icon: Cog6ToothIcon,
  },
]);

onMounted(() => {
  document.body.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.body.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.router-link-active-style {
  background-color: rgb(var(--muted) / 0.9);
}

.sidebar {
  display: flex;
  flex-direction: column;
  height: 100vh;
  transition: width 0.3s;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 10;
  border-right: none;
}
</style>
