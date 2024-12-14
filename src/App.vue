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
        <div class="min-h-full flex items-center justify-center w-full max-w-6xl mx-auto">
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
  import SideNav from './domains/shared/components/SideNav.vue';
  import TheFooter from './domains/shared/components/TheFooter.vue';
  import { onMounted, onBeforeUnmount } from 'vue';
  import { DBName } from '@/domains/shared/types';
  import { useSharedStore } from '@/domains/shared/store';
  import { loadSampleDecks, deleteIndexedDBDatabase } from '@/utils';

  const sharedStore = useSharedStore();

  const dbNames = [DBName.AZ, DBName.US, DBName.CAN, DBName.USCodes];

  async function cleanupIndexedDB(): Promise<void> {
    try {
      for (const dbName of dbNames) {
        await deleteIndexedDBDatabase(dbName);
      }
      console.log('Successfully cleaned up IndexedDB');
      return Promise.resolve();
    } catch (error) {
      console.error('Error cleaning up IndexedDB:', error);
      return Promise.reject(error);
    }
  }

  // Handle tab/window close
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    cleanupIndexedDB();

    // Optional: Show confirmation dialog if there's unsaved work
    // if (hasUnsavedWork) {
    //   event.preventDefault();
    //   event.returnValue = '';
    // }
  };

  // Handle page hide (more reliable than beforeunload)
  const handlePageHide = () => {
    cleanupIndexedDB();
  };

  onMounted(async () => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    try {
      // Clean up first
      await cleanupIndexedDB();
      // Then load sample data
      // await loadSampleDecks([DBName.AZ]);
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
