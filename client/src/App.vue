@ap
<template>
  <div
    id="app"
    class="flex min-h-screen bg-fbBlack text-fbWhite font-sans"
  >
    <SideNav class="z-20" />
    <div
      class="flex-1 flex flex-col transition-all duration-300"
      :class="[sharedStore.getSideNavOpen ? 'ml-[200px]' : 'ml-[64px]']"
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

<script setup lang="ts">
  import SideNav from '@/components/shared/SideNav.vue';
  import TheFooter from '@/components/shared/TheFooter.vue';
  import { onMounted, onBeforeUnmount } from 'vue';
  import { DBName, type DBNameType } from '@/types/app-types';
  import { useSharedStore } from '@/stores/shared-store';

  import { loadSampleDecks, cleanupSampleDatabases } from '@/utils/load-sample-data';


  const sharedStore = useSharedStore();

  

  async function cleanupIndexedDB(dbsToClean: DBNameType[]): Promise<void> {
    try {
      await cleanupSampleDatabases(dbsToClean);
    } catch (error) {
      console.error('Error cleaning up IndexedDB:', error);
      throw error;
    }
  }

  // Handle tab/window close
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    cleanupIndexedDB([DBName.AZ, DBName.US]);
  };

  // Handle page hide (more reliable than beforeunload)
  const handlePageHide = () => {
    cleanupIndexedDB([DBName.AZ, DBName.US]);
  };

  onMounted(async () => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    try {
      // Clean up first
      await cleanupIndexedDB([DBName.AZ, DBName.US]);

      // Load sample decks
      console.log('Loading sample decks...');
      await loadSampleDecks([DBName.AZ, DBName.US]);

      // Initialize LERG service and sync data
      // console.log('Initializing LERG service...');
      // await lergService.initialize();
      // console.log('Starting data sync to IndexedDB...');
      // await lergService.syncDataToIndexedDB();
      // console.log('Data sync complete');
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  });

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('pagehide', handlePageHide);
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
</style>
