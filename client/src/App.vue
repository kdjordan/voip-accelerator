<template>
  <div id="app" class="min-h-screen bg-fbBlack text-fbWhite font-sans">
    <!-- Full-screen Loading Overlay -->
    <div
      v-if="!userStore.getAuthIsInitialized"
      class="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-fbBlack"
    >
      <ArrowPathIcon class="animate-spin h-10 w-10 text-accent mb-4" />
      <p class="text-xl text-fbWhite">Loading Application...</p>
    </div>

    <!-- Main Application Content (rendered once auth is initialized) -->
    <template v-else>
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
  import { onMounted, onBeforeUnmount } from 'vue'; // Removed ref as showLoginToast is removed
  import { useUserStore } from '@/stores/user-store';
  import { clearApplicationDatabases } from '@/utils/cleanup';
  import { RouterView, useRoute, useRouter } from 'vue-router';
  import { computed, watchEffect, nextTick } from 'vue';
  import { ArrowPathIcon } from '@heroicons/vue/20/solid'; // Import Heroicon
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

  onMounted(() => {
    // Removed async as we are not awaiting inside directly
    // --- Run cleanup first (non-blocking) ---
    clearApplicationDatabases().catch((err) =>
      console.error('[App Mount] Error clearing databases:', err)
    );
    // ---------------------------------------

    // --- Reset Store States (non-blocking) ---
    console.log('[App Mount] Resetting store states (non-blocking)...');
    azStore
      .resetFiles()
      .catch((err) => console.error('[App Mount] Error resetting AZ store:', err));
    usStore
      .resetFiles()
      .catch((err) => console.error('[App Mount] Error resetting US store:', err));
    // TODO: Add resets for other stores if they manage data in cleared DBs
    // e.g., rateSheetStore.resetState().catch(err => console.error('Error resetting rate sheet store:', err));
    console.log('[App Mount] Store state reset initiated.');
    // -----------------------------------------

    // --- Initialize Auth Listener (non-blocking) ---
    console.log('[App Mount] Initializing authentication listener (non-blocking)...');
    userStore
      .initializeAuthListener()
      .then(() => {
        console.log(
          '[App Mount] Authentication listener initialization process completed (from non-blocking call).'
        );
      })
      .catch((authInitError) => {
        console.error(
          '[App Mount] Error initializing auth listener (from non-blocking call):',
          authInitError
        );
        // Potentially set a global error state if auth listener fails critically even in non-blocking mode
      });
    // ---------------------------------------------

    console.log(
      '[App Mount] Non-blocking initializations complete. App shell is ready. Auth is initializing.'
    );
  });

  // This watchEffect handles redirection AFTER auth is initialized.
  // The router guard should ideally handle the *initial* redirection before any component renders.
  // This can serve as a fallback or for handling changes post-initial load.
  watchEffect(async () => {
    const isInitialized = userStore.getAuthIsInitialized; // Reactive getter
    const isAuthenticated = userStore.getIsAuthenticated; // Reactive getter
    const currentPath = route.path;

    // Routes from which an authenticated user should be redirected
    const transitionalAuthRoutes = ['/', '/home', '/login', '/signup', '/auth/callback'];

    if (isInitialized && isAuthenticated && transitionalAuthRoutes.includes(currentPath)) {
      console.log(
        `[App WatchEffect] Conditions met for redirect. Path: "${currentPath}". User is authenticated and on a transitional route. Queuing redirect to /dashboard.`
      );
      await nextTick(); // Wait for DOM updates if any are pending from isInitialized changing

      // Double-check conditions after nextTick, as state might change rapidly
      if (
        userStore.getAuthIsInitialized && // Re-check reactive getter
        userStore.getIsAuthenticated && // Re-check reactive getter
        transitionalAuthRoutes.includes(route.path) // Re-check current route path
      ) {
        console.log(
          `[App WatchEffect] Executing redirect from "${route.path}" to /dashboard after nextTick.`
        );
        router.push({ name: 'dashboard' });
      } else {
        console.log(
          `[App WatchEffect] Redirect from "${currentPath}" aborted after nextTick. Conditions no longer met. Current path: ${route.path}, IsAuth: ${userStore.getIsAuthenticated}, IsInitialized: ${userStore.getAuthIsInitialized}`
        );
      }
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

  /* Toast Transition - Can be removed if no other toasts use it, or kept for other potential uses */

  /* Ensure body has proper scroll behavior */
</style>
