<template>
  <div id="app" class="min-h-screen bg-fbBlack text-fbWhite font-sans">
    <!-- Global Loading State -->
    <div
      v-if="!userStore.getAuthIsInitialized"
      class="fixed inset-0 z-50 flex items-center justify-center bg-fbBlack/80 backdrop-blur-sm"
    >
      <div class="text-xl text-accent">Loading Application...</div>
      <!-- Optional: Add a spinner icon here -->
    </div>

    <!-- Main Application Content (rendered once auth is initialized) -->
    <template v-if="userStore.getAuthIsInitialized">
      <!-- Different layout for marketing pages -->
      <template v-if="isMarketingPage">
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
          <SideNav
            v-if="shouldShowSideNav"
            :navigation="appNavigationItems"
            class="hidden md:block"
          />

          <!-- Main Content Area -->
          <div
            class="flex-1 flex flex-col transition-all duration-300 pt-16 md:pt-0"
            :class="[
              shouldShowSideNav && userStore.ui.isSideNavOpen
                ? 'md:ml-[200px]'
                : shouldShowSideNav
                  ? 'md:ml-[64px]'
                  : '',
            ]"
          >
            <main class="flex-1">
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
    </template>
  </div>
</template>

<script setup lang="ts">
  import SideNav from '@/components/shared/SideNav.vue';
  import AppMobileNav from '@/components/shared/AppMobileNav.vue'; // Import AppMobileNav
  import TheFooter from '@/components/shared/TheFooter.vue';
  import { onMounted, onBeforeUnmount, ref } from 'vue';
  import { useUserStore } from '@/stores/user-store';
  import { clearApplicationDatabases } from '@/utils/cleanup';
  import { RouterView, useRoute, useRouter } from 'vue-router';
  import { computed, watchEffect, nextTick } from 'vue';
  // Import relevant stores
  import { useAzStore } from '@/stores/az-store';
  import { useUsStore } from '@/stores/us-store';
  import { appNavigationItems } from '@/constants/navigation'; // Import app navigation items
  // TODO: Add imports for other stores if needed (e.g., rate sheets)

  const route = useRoute();
  const router = useRouter(); // Added router instance
  const userStore = useUserStore();
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
    '/:pathMatch(.*)*', // Add catch-all for 404 page
  ];

  // Marketing pages that need full width
  const marketingPages = [
    '/',
    '/home',
    '/about',
    '/pricing',
    '/terms-and-conditions',
    '/privacy-policy',
    '/:pathMatch(.*)*', // Add catch-all for 404 page
  ];

  // Compute whether to show the SideNav based on the current route
  const shouldShowSideNav = computed(() => {
    // SideNav should only show if not a public route AND on md+ screens (handled by class binding)
    return !publicRoutes.includes(route.path);
  });

  // Determine if current page is a marketing page that should be full width
  const isMarketingPage = computed(() => {
    // Check if the path is explicitly listed OR if it's the named 404 route
    return marketingPages.includes(route.path) || route.name === 'notFound';
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

    // --- Initialize Auth Listener ---
    // Await the initialization before proceeding. Router guards will wait.
    try {
      console.log('[App Mount] Initializing authentication listener...');
      await userStore.initializeAuthListener(); // This now returns a Promise
      console.log('[App Mount] Authentication listener initialized and ready.');
    } catch (authInitError) {
      console.error('[App Mount] Error initializing auth listener:', authInitError);
      // Handle error appropriately - maybe show an error message or redirect
    }
    // --------------------------

    console.log('[App Mount] Initialization complete. App is ready.');
    // Rest of your initialization logic can go here if needed

    // REMOVE: This logic is no longer needed here as auth is initialized first
    /* 
    try {
      console.log(
        'Starting application initialization AFTER cleanup, store reset, and auth init...'
      );
      // Rest of your initialization logic can go here
    } catch (error) {
      console.error('Error during initialization:', error);
    }
    */
  });

  watchEffect(async () => {
    const isInitialized = userStore.getAuthIsInitialized;
    const isAuthenticated = userStore.getIsAuthenticated;
    const currentPath = route.path;

    // Routes from which an authenticated user should be redirected
    const transitionalAuthRoutes = ['/', '/home', '/login', '/signup', '/auth/callback'];

    if (isInitialized && isAuthenticated && transitionalAuthRoutes.includes(currentPath)) {
      console.log(
        `[App WatchEffect] Conditions met for redirect. Path: "${currentPath}". Queuing redirect to /dashboard.`
      );
      await nextTick();

      if (
        userStore.getAuthIsInitialized &&
        userStore.getIsAuthenticated &&
        transitionalAuthRoutes.includes(route.path)
      ) {
        console.log(
          `[App WatchEffect] Executing redirect from "${route.path}" to /dashboard after nextTick.`
        );
        router.push({ name: 'dashboard' });
      } else {
        console.log(
          `[App WatchEffect] Redirect from "${currentPath}" aborted after nextTick. Conditions no longer met. Current path: ${route.path}, IsAuth: ${userStore.getIsAuthenticated}`
        );
      }
    } else if (isInitialized && !transitionalAuthRoutes.includes(currentPath)) {
      // This log helps confirm the effect runs when initialized but not on a transitional route.
    }
  });

  onBeforeUnmount(() => {
    // REMOVE event listener removal
    // window.removeEventListener('pagehide', handlePageHide);
    // window.removeEventListener('beforeunload', handleBeforeUnload);
  });
</script>
<style>
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
