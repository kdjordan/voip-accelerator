<template>
  <div class="hidden md:block relative">
    <nav
      :class="[
        'sidebar border-r border-line bg-surface',
        userStore.ui.isSideNavOpen ? 'w-[200px]' : 'w-[80px]',
      ]"
    >
      <!-- Collapse / expand toggle -->
      <button
        @click="userStore.toggleSideNav"
        class="w-full flex items-center py-3 text-fg-faint hover:text-fg hover:bg-row-hover transition-colors"
        :class="userStore.ui.isSideNavOpen ? 'justify-end pr-3' : 'justify-center'"
        :aria-label="userStore.ui.isSideNavOpen ? 'Collapse sidebar' : 'Expand sidebar'"
      >
        <ArrowLeftEndOnRectangleIcon v-if="userStore.ui.isSideNavOpen" class="w-4 h-4" />
        <ArrowRightStartOnRectangleIcon v-else class="w-4 h-4" />
      </button>

      <!-- Brand lockup — red chip + Geist Mono uppercase wordmark -->
      <div
        :class="[
          'px-3 py-3.5 flex items-center border-b border-line',
          userStore.ui.isSideNavOpen ? 'justify-start' : 'justify-center',
        ]"
      >
        <RouterLink to="/dashboard" class="flex items-center gap-3 no-underline">
          <span class="brand-chip h-7 w-7 shrink-0">
            <BoltIcon class="h-3.5 w-3.5" />
          </span>
          <span
            v-if="userStore.ui.isSideNavOpen"
            class="font-display font-semibold text-xs uppercase tracking-[0.04em] text-fg whitespace-nowrap"
            >VoIP Accel.</span
          >
        </RouterLink>
      </div>

      <ul class="flex-grow mt-3.5 px-2 flex flex-col gap-0.5">
        <li v-for="item in filteredNavigation" :key="item.name">
          <RouterLink
            :to="item.href!"
            class="flex items-center py-2 font-display text-xs uppercase tracking-[0.04em] overflow-hidden border-l-2"
            :class="[
              userStore.ui.isSideNavOpen ? 'gap-2.5 pl-2.5 pr-2.5' : 'w-full justify-center px-0',
              route.path === item.href
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-transparent text-fg-faint hover:bg-row-hover hover:text-fg',
            ]"
          >
            <component
              v-if="item.icon"
              :is="item.icon"
              class="w-4 h-4 flex-shrink-0"
            />
            <span v-if="userStore.ui.isSideNavOpen" class="whitespace-nowrap">{{ item.name }}</span>
          </RouterLink>
        </li>
      </ul>

      <!-- Theme selector (bottom-left, per portal kit) -->
      <div class="mt-auto border-t border-line">
        <!-- Expanded: segmented control -->
        <div
          v-if="userStore.ui.isSideNavOpen"
          class="p-3 flex items-center justify-between gap-2"
        >
          <div class="flex border border-line-strong">
            <button
              v-for="opt in themeOptions"
              :key="opt.value"
              type="button"
              @click="setTheme(opt.value)"
              :aria-label="opt.label"
              :aria-pressed="theme === opt.value"
              class="grid place-items-center w-8 h-7 transition-colors"
              :class="
                theme === opt.value
                  ? 'bg-accent-soft text-accent'
                  : 'text-fg-faint hover:text-fg hover:bg-row-hover'
              "
            >
              <component :is="opt.icon" class="w-3.5 h-3.5" />
            </button>
          </div>
          <span class="font-display text-[10px] uppercase tracking-[0.12em] text-fg-mute">
            Theme
          </span>
        </div>

        <!-- Collapsed: single cycle button (icon shows the active theme) -->
        <div v-else class="p-3 flex justify-center">
          <button
            type="button"
            @click="cycleTheme"
            :aria-label="`Theme: ${theme} — click to change`"
            class="grid place-items-center w-8 h-8 border border-line-strong text-fg-faint hover:text-fg hover:bg-row-hover transition-colors"
          >
            <component :is="activeThemeIcon" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </nav>

    <!-- Drag handle to toggle collapse -->
    <div
      class="ml-2 fixed top-0 bottom-0 w-[8px] hover:bg-row-hover transition-colors cursor-ew-resize"
      :style="{ left: userStore.ui.isSideNavOpen ? '194px' : '58px', transform: 'translateX(0)' }"
      @click="userStore.toggleSideNav"
    ></div>
  </div>
</template>

<script setup lang="ts">
  import { RouterLink, useRoute } from 'vue-router';
  import { computed } from 'vue';
  import { useUserStore } from '@/stores/user-store';
  import { useTheme, type Theme } from '@/composables/useTheme';
  import { BoltIcon } from '@heroicons/vue/24/solid';
  import {
    ArrowLeftEndOnRectangleIcon,
    ArrowRightStartOnRectangleIcon,
    SunIcon,
    MoonIcon,
    ComputerDesktopIcon,
  } from '@heroicons/vue/24/outline';
  import type { NavigationItem } from '@/types/nav-types';

  const userStore = useUserStore();
  const route = useRoute();

  const isAuthenticated = computed(() => userStore.getIsAuthenticated);
  const isAdmin = computed(() => userStore.isAdmin);

  const props = defineProps<{ navigation: NavigationItem[] }>();

  // Flat nav (no children): filter by auth/role only.
  const filteredNavigation = computed(() =>
    props.navigation.filter((item) => {
      if (item.meta?.hideWhenAuthed && isAuthenticated.value) return false;
      if (item.meta?.requiresAuth && !isAuthenticated.value) return false;
      if (item.meta?.requiresAdmin && !isAdmin.value) return false;
      return true;
    })
  );

  // ── Theme selector ──────────────────────────────────────────────────────
  const { theme, setTheme } = useTheme();

  const themeOptions: { value: Theme; label: string; icon: typeof SunIcon }[] = [
    { value: 'light', label: 'Light theme', icon: SunIcon },
    { value: 'dark', label: 'Dark theme', icon: MoonIcon },
    { value: 'system', label: 'System theme', icon: ComputerDesktopIcon },
  ];

  const activeThemeIcon = computed(
    () => themeOptions.find((o) => o.value === theme.value)?.icon ?? ComputerDesktopIcon
  );

  function cycleTheme(): void {
    const order: Theme[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(theme.value) + 1) % order.length];
    setTheme(next);
  }
</script>

<style scoped>
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    height: 100vh;
    transition: width 0.3s ease-in-out;
    overflow-y: auto;
    overflow-x: hidden;
    z-index: 30;
  }
</style>
