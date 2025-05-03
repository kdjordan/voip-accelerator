<template>
  <div id="app" class="min-h-screen bg-fbBlack text-fbWhite font-sans">
    <!-- Different layout for marketing pages -->
    <template v-if="isMarketingPage">
      <!-- MarketingMobileNav will be added within specific marketing page layouts (e.g., HomeView) -->
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in" appear>
          <component :is="Component" />
        </transition>
      </router-view>
    </template>

    <!-- App layout with sidebar/mobile nav for non-marketing pages -->
    <template v-else>
      <div class="flex min-h-screen">
        <!-- Mobile Nav (only on small screens) -->
        <AppMobileNav :items="appNavigationItems" class="md:hidden" />

        <!-- Side Nav (only on medium screens and up) -->
        <SideNav v-if="shouldShowSideNav" class="hidden md:block" />

        <!-- Main Content Area -->
        <!-- Added pt-16 md:pt-0 for mobile header space -->
        <div
          class="flex-1 flex flex-col transition-all duration-300 pt-16 md:pt-0"
          :class="[
            shouldShowSideNav && sharedStore.getSideNavOpen
              ? 'md:ml-[200px]' // Apply margin only on md+ screens
              : shouldShowSideNav
                ? 'md:ml-[64px]' // Apply margin only on md+ screens
                : '',
          ]"
        >
          <main class="flex-1">
            <!-- Added padding for content -->
            <div
              class="min-h-full flex justify-center w-full max-w-6xl mx-auto mt-10 px-4 sm:px-6 lg:px-8"
            >
              <router-view v-slot="{ Component }">
                <transition name="fade" mode="out-in" appear>
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
  import AppMobileNav from '@/components/shared/AppMobileNav.vue'; // Import AppMobileNav
  import TheFooter from '@/components/shared/TheFooter.vue';
  import { onMounted, onBeforeUnmount, ref } from 'vue';
  import { useSharedStore } from '@/stores/shared-store';
  import { clearApplicationDatabases } from '@/utils/cleanup';
  import { RouterView, useRoute } from 'vue-router';
  import { computed } from 'vue';
  // Import relevant stores
  import { useAzStore } from '@/stores/az-store';
  import { useUsStore } from '@/stores/us-store';
  import { appNavigationItems } from '@/constants/navigation'; // Import app navigation items
  // TODO: Add imports for other stores if needed (e.g., rate sheets)

  const route = useRoute();
  const sharedStore = useSharedStore();
  // Instantiate stores
  const azStore = useAzStore();
  const usStore = useUsStore();
  // TODO: Instantiate other stores if needed

  // Public routes where SideNav should not be shown
  const publicRoutes = [
    '/',
    '/home',
    '/about',
    '/pricing',
    '/login',
    '/signup',
    '/terms-and-conditions',
    '/privacy-policy',
  ];

  // Marketing pages that need full width
  const marketingPages = [
    '/',
    '/home',
    '/about',
    '/pricing',
    '/terms-and-conditions',
    '/privacy-policy',
  ];

  // Compute whether to show the SideNav based on the current route
  const shouldShowSideNav = computed(() => {
    // SideNav should only show if not a public route AND on md+ screens (handled by class binding)
    return !publicRoutes.includes(route.path);
  });

  // Determine if current page is a marketing page that should be full width
  const isMarketingPage = computed(() => {
    return marketingPages.includes(route.path);
  });

  // Get SideNav expanded state from store
  // const sideNavExpanded = computed(() => {
  //   return sharedStore.getSideNavOpen;
  // });

  onMounted(async () => {
    // --- Run cleanup first ---
    await clearApplicationDatabases();
    // -------------------------

    // --- Reset Store States ---
    console.log('[App Mount] Resetting store states...');
    try {
      // Call reset actions for stores managing data related to cleared DBs
      await azStore.resetFiles(); // Resets AZ files, reports, comparison table name
      await usStore.resetFiles(); // Resets US files, reports, etc.
      // TODO: Add resets for other stores if they manage data in cleared DBs
      // e.g., await rateSheetStore.resetState();
      console.log('[App Mount] Store states reset.');
    } catch (storeResetError) {
      console.error('[App Mount] Error resetting store states:', storeResetError);
    }
    // --------------------------

    try {
      console.log('Starting application initialization AFTER cleanup and store reset...');
      // Rest of your initialization logic can go here
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  });

  onBeforeUnmount(() => {
    // REMOVE event listener removal
    // window.removeEventListener('pagehide', handlePageHide);
    // window.removeEventListener('beforeunload', handleBeforeUnload);
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
</style>
