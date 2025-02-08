<template>
  <div class="relative">
    <nav :class="['sidebar', 'border-r border-muted fixed top-0 left-0 bottom-0', isOpen ? 'w-[200px]' : 'w-[64px]']">
      <h1 class="text-center py-2 mb-4">
        <div class="flex items-center text-fbGreen px-4 mb-0">
          <span class="text-3xl">V</span>
          <BoltIcon class="w-8 h-8 -ml-1 flex-shrink-0" />
        </div>
      </h1>
      <ul class="flex-grow">
        <li
          v-for="item in items"
          :key="item.name"
          class="px-2 my-1 text-sizeSm"
        >
          <RouterLink
            :to="item.to"
            class="flex items-center py-2 px-3 rounded-md transition-colors hover:bg-fbHover overflow-hidden"
            :class="[isOpen ? 'space-x-2' : 'justify-center', { 'bg-fbHover': $route.path === item.to }]"
          >
            <component
              :is="item.icon"
              class="w-5 h-5 text-fbWhite flex-shrink-0"
            />
            <span
              v-if="isOpen"
              class="text-fbWhite whitespace-nowrap"
              >{{ item.name }}</span
            >
          </RouterLink>
        </li>
      </ul>
      <!-- Collapse Arrow -->
      <div class="px-2">
        <button
          @click="toggleSidebar"
          class="flex items-center justify-center h-8 w-8 rounded-md border border-fbBorder hover:bg-fbHover transition-all"
          :class="[isOpen ? 'ml-auto' : 'mx-auto']"
        >
          <ChevronLeftIcon
            class="w-5 h-5 text-fbWhite transition-transform"
            :class="{ 'rotate-180': !isOpen }"
          />
        </button>
      </div>
      <!-- User Dropdown -->
      <div class="p-4 relative">
        <!-- Dropdown Menu -->
        <div
          v-if="dropdownOpen"
          ref="dropdownRef"
          class="dropdown fixed bottom-[72px] left-4 w-[240px] p-2 bg-fbBlack border border-fbBorder/70 rounded-lg z-50"
        >
          <!-- Email -->
          <div class="px-3 py-2 text-sm text-fbLightMuted">
            {{ userStore.userEmail }}
          </div>

          <!-- User Info -->
          <div class="px-3 py-2 flex items-center space-x-3">
            <div class="w-8 h-8 rounded-md bg-gradient-to-br from-fbGreen/90 to-fbGray/80"></div>
            <div>
              <div class="text-sizeSm">{{ userStore.username }}</div>
              <div class="text-xs text-fbLightMuted">{{ userStore.currentPlan }}</div>
            </div>
          </div>

          <div class="border-t border-fbBorder my-2"></div>

          <!-- Menu Items -->
          <button class="w-full text-left px-3 py-2 hover:bg-fbHover rounded-md flex items-center space-x-2">
            <CreditCardIcon class="w-4 h-4 text-foreground" />
            <span>Billing</span>
          </button>
          <button class="w-full text-left px-3 py-2 hover:bg-fbHover rounded-md flex items-center space-x-2">
            <ArrowRightEndOnRectangleIcon class="w-4 h-4 text-fbWhite" />
            <span>Sign Out</span>
          </button>

          <div class="border-t border-fbBorder my-2"></div>

          <!-- Upgrade Plan -->
          <button class="w-full text-left px-3 py-2 hover:bg-fbHover rounded-md">Upgrade Plan</button>
        </div>

        <!-- User Button -->
        <div class="px-2 flex justify-center">
          <button
            @click="toggleDropdown"
            @click.stop
            class="flex items-center hover:bg-fbHover rounded-md transition-all overflow-hidden min-w-[32px] min-h-[32px] p-0"
            :class="[isOpen ? 'w-full p-2 space-x-3' : 'w-8 h-8']"
          >
            <div class="h-8 w-8 rounded-md bg-gradient-to-br from-accent/80 to-fbBlack flex-shrink-0"></div>
            <div
              v-if="isOpen"
              class="flex-grow text-left"
            >
              <div class="text-sm text-fbWhite whitespace-nowrap">{{ userStore.username }}</div>
              <div class="text-xs text-muted-foreground whitespace-nowrap">
                {{ userStore.currentPlan === PlanTier.PRO ? 'Pro' : 'Free' }}
              </div>
            </div>
            <ChevronUpDownIcon
              v-if="isOpen"
              class="w-4 h-4 text-muted-foreground"
            />
          </button>
        </div>
      </div>
    </nav>
    <!-- Add this new border element -->
    <div
      class="ml-2 fixed top-0 bottom-0 w-[8px] hover:bg-fbHover transition-colors cursor-ew-resize"
      :style="{
        left: isOpen ? '194px' : '58px' /* Adjusted further left to keep centered on border */,
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
    DocumentCurrencyDollarIcon,
    BarsArrowDownIcon,
    PercentBadgeIcon,
    ChevronLeftIcon,
    ChevronUpDownIcon,
    BoltIcon,
    CreditCardIcon,
    ArrowRightEndOnRectangleIcon,
    HeartIcon,
    Cog6ToothIcon,
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
      name: 'AZ Reporting',
      to: '/azpricing',
      icon: DocumentCurrencyDollarIcon,
    },
    {
      name: 'US Reporting',
      to: '/uspricing',
      icon: DocumentCurrencyDollarIcon,
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
