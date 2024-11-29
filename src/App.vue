<template>
  <div id="app" class="flex min-h-screen bg-fbBlack text-fbWhite font-sans">
    <SideNav class="z-20" />
    <div 
      class="flex-1 flex flex-col transition-all duration-300"
      :class="[
        userStore.isSideNavOpen ? 'ml-[200px]' : 'ml-[64px]'
      ]"
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
	import SideNav from './components/common/SideNav.vue';
	import TheFooter from './components/common/TheFooter.vue';
	import { onMounted, onBeforeUnmount } from 'vue';
	import { useUserStore } from '@/stores/userStore';
	import { deleteAllDbsApi } from '@/API/api';
	
	import { setUser} from '@/lib/utils'
import { DBName } from './types/app-types';

	//used for tracking SideNav open or closed
	const userStore = useUserStore();

	const dbNames = ['az', 'us', 'can']; // List your database names here

	const handleBeforeUnload = () => {
		deleteAllDbsApi(dbNames);
	};

	onMounted(async () => {
		window.addEventListener('beforeunload', handleBeforeUnload);
		setUser('free', true, [DBName.AZ]);
	});

	onBeforeUnmount(() => {
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