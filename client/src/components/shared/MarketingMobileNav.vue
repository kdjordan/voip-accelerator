<template>
  <div>
    <!-- Mobile Header -->
    <header class="flex h-auto items-center justify-between p-4 sm:px-6">
      <!-- Logo/Brand Name (Glitch Removed) -->
      <RouterLink to="/home" class="flex items-center text-accent gap-2">
        <BoltIcon class="w-8 h-8 flex-shrink-0 text-accent" />
        <span class="text-lg font-bold font-secondary text-accent">VOIP Accelerator</span>
      </RouterLink>

      <!-- Hamburger Button -->
      <button
        type="button"
        class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-accent"
        @click="toggleMenu"
      >
        <span class="sr-only">Open main menu</span>
        <Bars3Icon class="h-6 w-6" aria-hidden="true" />
      </button>
    </header>

    <!-- Mobile Menu Panel (Flyout) -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <!-- Panel background changed to fbBlack -->
      <div
        v-if="isMarketingMobileMenuOpen"
        class="fixed inset-0 z-50 overflow-y-auto bg-fbBlack p-4"
      >
        <div class="flex items-center justify-between">
          <!-- Logo/Brand Name in Panel (Glitch Removed) -->
          <RouterLink to="/home" class="flex items-center text-accent gap-2" @click="closeMenu">
            <BoltIcon class="w-8 h-8 flex-shrink-0 text-accent" />
            <span class="text-lg font-bold font-secondary text-accent">VOIP Accelerator</span>
          </RouterLink>
          <!-- Close button color changed to accent -->
          <button type="button" class="-m-2.5 rounded-md p-2.5 text-accent" @click="closeMenu">
            <span class="sr-only">Close menu</span>
            <XMarkIcon class="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div class="mt-6 flow-root">
          <!-- Divider color changed to divide-accent/20 -->
          <div class="-my-6 divide-y divide-accent/20">
            <div class="space-y-2 py-6">
              <RouterLink
                v-for="item in items"
                :key="item.name"
                :to="item.href"
                class="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-neutral-800"
                @click="closeMenu"
              >
                {{ item.name }}
              </RouterLink>
              <!-- Add Login/Signup Buttons Explicitly -->
              <RouterLink
                to="/dashboard"
                class="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-neutral-800"
                @click="closeMenu"
              >
                Log in
              </RouterLink>
              <RouterLink
                to="/dashboard"
                class="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-neutral-800"
                @click="closeMenu"
              >
                Sign up
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { RouterLink } from 'vue-router';
  import { Bars3Icon, XMarkIcon, BoltIcon } from '@heroicons/vue/24/outline';
  import type { NavigationItem } from '@/types/nav-types';

  // Props
  interface Props {
    items: NavigationItem[];
  }
  const props = defineProps<Props>();

  // Local State
  const isMarketingMobileMenuOpen = ref(false);

  // Methods
  function toggleMenu(): void {
    isMarketingMobileMenuOpen.value = !isMarketingMobileMenuOpen.value;
  }

  function closeMenu(): void {
    isMarketingMobileMenuOpen.value = false;
  }
</script>

<style scoped>
  /* Glitch effect styles removed */
</style>
