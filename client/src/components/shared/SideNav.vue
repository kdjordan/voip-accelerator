<template>
  <div class="relative">
    <nav :class="['sidebar', 'border-r border-muted fixed top-0 left-0 bottom-0', isOpen ? 'w-[200px]' : 'w-[80px]']">
      <!-- Logo and Collapse Control -->
      <div class="px-3 py-3 flex items-center">
        <RouterLink
          to="/home"
          class="flex items-center text-accent gap-2"
        >
          <BoltIcon class="w-8 h-8 flex-shrink-0" />
          <span
            v-if="isOpen"
            class="font-medium text-accent whitespace-nowrap"
            >VOIP Accelerator</span
          >
        </RouterLink>
      </div>

      <ul class="flex-grow mt-4 font-secondary tracking-tight">
        <li
          v-for="item in items"
          :key="item.name"
          class="px-2 my-1 text-sizeSm"
        >
          <RouterLink
            :to="item.to"
            class="flex items-center py-2 px-3 rounded-md border transition-all overflow-hidden"
            :class="[
              isOpen ? 'space-x-2' : 'justify-center',
              $route.path === item.to ? 'bg-accent/20 border-accent/50' : 'hover:bg-fbHover border-transparent',
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

    <!-- Collapse button positioned on the edge -->
    <button
      @click="toggleSidebar"
      class="fixed top-3 transition-all flex items-center justify-center p-1 rounded hover:bg-accent/20 bg-accent/10 border border-accent/50 min-w-[24px] min-h-[24px] z-20"
      :style="{ left: isOpen ? '208px' : '88px' }"
    >
      <ChevronLeftIcon
        class="w-4 h-4 text-accent transition-transform"
        :class="{ 'rotate-180': !isOpen }"
      />
    </button>

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
    ChevronUpDownIcon,
    BoltIcon,
    CreditCardIcon,
    ArrowRightEndOnRectangleIcon,
    Cog6ToothIcon,
    GlobeAltIcon,
    GlobeAmericasIcon,
    AdjustmentsVerticalIcon,
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
      to: '/azview',
      icon: GlobeAltIcon,
    },
    {
      name: 'US Reporting',
      to: '/usview',
      icon: GlobeAmericasIcon,
    },
    {
      name: 'Rate Sheet Wizard',
      to: '/rate-sheet',
      icon: AdjustmentsVerticalIcon,
    },
    {
      name: 'Lerg Admin',
      to: '/admin/lerg',
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
