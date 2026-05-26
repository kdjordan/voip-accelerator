<template>
  <div class="hidden md:block relative">
    <nav
      :class="[
        'sidebar border-r border-white/[0.06] fixed top-0 left-0 bottom-0 bg-ink-raised',
        userStore.ui.isSideNavOpen ? 'w-[200px]' : 'w-[80px]',
      ]"
    >
      <!-- Collapse / expand toggle -->
      <button
        @click="userStore.toggleSideNav"
        class="w-full flex items-center py-3 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
        :class="userStore.ui.isSideNavOpen ? 'justify-end pr-3' : 'justify-center'"
        :aria-label="userStore.ui.isSideNavOpen ? 'Collapse sidebar' : 'Expand sidebar'"
      >
        <ArrowLeftEndOnRectangleIcon v-if="userStore.ui.isSideNavOpen" class="w-4 h-4" />
        <ArrowRightStartOnRectangleIcon v-else class="w-4 h-4" />
      </button>

      <!-- Logo (matches landing: emerald bolt chip + white wordmark) -->
      <div
        :class="[
          'px-3 py-3 flex items-center',
          userStore.ui.isSideNavOpen ? 'justify-start' : 'justify-center',
        ]"
      >
        <RouterLink to="/dashboard" class="flex items-center gap-2.5">
          <span
            class="h-8 w-8 shrink-0 grid place-items-center rounded-lg bg-emerald-400/10 ring-1 ring-emerald-400/30"
          >
            <BoltIcon class="h-4 w-4 text-emerald-400" />
          </span>
          <span
            v-if="userStore.ui.isSideNavOpen"
            class="font-semibold tracking-tight text-white whitespace-nowrap"
            >VoIP Accelerator</span
          >
        </RouterLink>
      </div>

      <ul class="flex-grow mt-4 font-secondary tracking-tight">
        <li v-for="item in filteredNavigation" :key="item.name" class="px-2 my-1 text-sm">
          <RouterLink
            :to="item.href!"
            class="flex items-center py-2 px-3 rounded-lg transition-colors overflow-hidden"
            :class="[
              userStore.ui.isSideNavOpen ? 'gap-2.5' : 'w-full justify-center',
              route.path === item.href
                ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20'
                : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100',
            ]"
          >
            <component
              v-if="item.icon"
              :is="item.icon"
              class="w-5 h-5 flex-shrink-0"
              :class="route.path === item.href ? 'text-emerald-400' : 'text-zinc-500'"
            />
            <span v-if="userStore.ui.isSideNavOpen" class="whitespace-nowrap">{{ item.name }}</span>
          </RouterLink>
        </li>
      </ul>

      <!-- Help card -->
      <div class="mt-auto p-3">
        <div
          v-if="userStore.ui.isSideNavOpen"
          class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
        >
          <div class="flex items-center gap-2 text-zinc-300">
            <QuestionMarkCircleIcon class="h-4 w-4 text-zinc-400 flex-shrink-0" />
            <span class="text-sm font-medium">Need help?</span>
          </div>
          <p class="mt-1.5 text-xs leading-relaxed text-zinc-500">
            Check out our guide on preparing files for accurate analysis.
          </p>
          <a
            href="#"
            @click.prevent
            class="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            View Guide <ArrowTopRightOnSquareIcon class="h-3 w-3" />
          </a>
        </div>
        <a
          v-else
          href="#"
          @click.prevent
          class="flex justify-center py-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="Help guide"
        >
          <QuestionMarkCircleIcon class="h-5 w-5" />
        </a>
      </div>
    </nav>

    <!-- Drag handle to toggle collapse -->
    <div
      class="ml-2 fixed top-0 bottom-0 w-[8px] hover:bg-white/[0.06] transition-colors cursor-ew-resize"
      :style="{ left: userStore.ui.isSideNavOpen ? '194px' : '58px', transform: 'translateX(0)' }"
      @click="userStore.toggleSideNav"
    ></div>
  </div>
</template>

<script setup lang="ts">
  import { RouterLink, useRoute } from 'vue-router';
  import { computed } from 'vue';
  import { useUserStore } from '@/stores/user-store';
  import {
    ArrowLeftEndOnRectangleIcon,
    ArrowRightStartOnRectangleIcon,
    BoltIcon,
    QuestionMarkCircleIcon,
    ArrowTopRightOnSquareIcon,
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
  }
</style>
