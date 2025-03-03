<template>
  <div
    id="app"
    class="min-h-screen bg-fbBlack text-fbWhite font-sans"
  >
    <!-- Different layout for marketing pages -->
    <template v-if="isMarketingPage">
      <router-view v-slot="{ Component }">
        <transition
          name="fade"
          mode="out-in"
          appear
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </template>

    <!-- App layout with sidebar for non-marketing pages -->
    <template v-else>
      <div class="flex min-h-screen">
        <SideNav v-if="shouldShowSideNav" />
        <div
          class="flex-1 flex flex-col transition-all duration-300"
          :class="[
            shouldShowSideNav && sharedStore.getSideNavOpen ? 'ml-[200px]' : shouldShowSideNav ? 'ml-[64px]' : '',
          ]"
        >
          <main class="flex-1">
            <div class="min-h-full flex justify-center w-full max-w-6xl mx-auto mt-10">
              <router-view v-slot="{ Component }">
                <transition
                  name="fade"
                  mode="out-in"
                  appear
                >
                  <component :is="Component" />
                </transition>
              </router-view>
            </div>
          </main>
          <TheFooter />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import SideNav from '@/components/shared/SideNav.vue';
  import TheFooter from '@/components/shared/TheFooter.vue';
  import { onMounted, onBeforeUnmount } from 'vue';
  import { useSharedStore } from '@/stores/shared-store';
  import { cleanupDatabases } from '@/utils/cleanup';
  import { RouterView, useRoute } from 'vue-router';
  import { computed } from 'vue';

  const route = useRoute();
  const sharedStore = useSharedStore();

  let isCleaningUp = false;

  // Public routes where SideNav should not be shown
  const publicRoutes = ['/', '/home', '/about', '/pricing', '/login', '/signup'];

  // Marketing pages that need full width
  const marketingPages = ['/', '/home', '/about', '/pricing'];

  // Compute whether to show the SideNav based on the current route
  const shouldShowSideNav = computed(() => {
    return !publicRoutes.includes(route.path);
  });

  // Determine if current page is a marketing page that should be full width
  const isMarketingPage = computed(() => {
    return marketingPages.includes(route.path);
  });

  // Get SideNav expanded state from store
  const sideNavExpanded = computed(() => {
    return sharedStore.getSideNavOpen;
  });

  const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
    if (isCleaningUp) return;
    isCleaningUp = true;

    // Show "Changes you made may not be saved" dialog
    event.preventDefault();
    event.returnValue = '';

    try {
      await cleanupDatabases();
    } finally {
      isCleaningUp = false;
    }
  };

  const handlePageHide = async () => {
    if (isCleaningUp) return;
    isCleaningUp = true;

    try {
      await cleanupDatabases();
    } finally {
      isCleaningUp = false;
    }
  };

  onMounted(async () => {
    window.addEventListener('pagehide', handlePageHide);
    // Keep beforeunload for page refreshes
    window.addEventListener('beforeunload', handleBeforeUnload);

    try {
      console.log('Starting application initialization...');
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  });

  onBeforeUnmount(() => {
    window.removeEventListener('pagehide', handlePageHide);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  });
</script>
<style>
  .rborder {
    border: 1px solid red;
  }
  .gborder {
    border: 1px solid green;
  }
  .bborder {
    border: 1px solid blue;
  }
  .wborder {
    border: 10px solid white;
  }

  /* Add these transition classes */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  /* Ensure body has proper scroll behavior */
  html,
  body {
    height: 100%;
    overflow-x: hidden;
    position: relative;
  }
</style>
