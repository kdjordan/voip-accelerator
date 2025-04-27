<template>
  <div id="app" class="min-h-screen bg-fbBlack text-fbWhite font-sans">
    <!-- Different layout for marketing pages -->
    <template v-if="isMarketingPage">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in" appear>
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
            shouldShowSideNav && sharedStore.getSideNavOpen
              ? 'ml-[200px]'
              : shouldShowSideNav
              ? 'ml-[64px]'
              : '',
          ]"
        >
          <main class="flex-1">
            <div class="min-h-full flex justify-center w-full max-w-6xl mx-auto mt-10">
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
import TheFooter from '@/components/shared/TheFooter.vue';
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useSharedStore } from '@/stores/shared-store';
import { clearApplicationDatabases } from '@/utils/cleanup';
import { RouterView, useRoute } from 'vue-router';
import { computed } from 'vue';
// Import relevant stores
import { useAzStore } from '@/stores/az-store';
import { useUsStore } from '@/stores/us-store';
// TODO: Add imports for other stores if needed (e.g., rate sheets)

const route = useRoute();
const sharedStore = useSharedStore();
// Instantiate stores
const azStore = useAzStore();
const usStore = useUsStore();
// TODO: Instantiate other stores if needed

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
