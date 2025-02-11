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
  import { lergApiService } from '@/services/lerg-api.service';
  import { useLergStore } from '@/stores/lerg-store';
  import { cleanupDatabases } from '@/utils/cleanup';

  import { loadSampleDecks } from '@/utils/load-sample-data';

  const sharedStore = useSharedStore();

  let isCleaningUp = false;

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

      // console.log('Loading sample decks...');
      await loadSampleDecks([DBName.AZ]);

      console.log('Initializing LERG service...');
      await lergApiService.initialize();

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
</style>
