<template>
  <div>
    <!-- Mobile Header - No longer fixed, added padding, updated logo -->
    <header class="flex h-auto items-center justify-between p-4 sm:px-6">
      <!-- Logo/Brand Name with Glitch Effect -->
      <RouterLink to="/home" class="flex items-center text-white">
        <div class="glitch-container">
          <BoltIcon class="w-8 h-8 glitch-item" />
        </div>
        <div class="glitch-text-container ml-2">
          <span class="text-lg font-bold font-secondary glitch-text">VOIP Accelerator</span>
        </div>
      </RouterLink>

      <!-- Hamburger Button -->
      <button
        type="button"
        class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-neutral-300"
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
      <!-- Panel remains fixed, full screen -->
      <div
        v-if="isMarketingMobileMenuOpen"
        class="fixed inset-0 z-50 overflow-y-auto bg-neutral-900 p-4"
      >
        <div class="flex items-center justify-between">
          <!-- Logo/Brand Name in Panel -->
          <RouterLink to="/home" class="flex items-center text-white" @click="closeMenu">
            <div class="glitch-container">
              <BoltIcon class="w-8 h-8 glitch-item" />
            </div>
            <div class="glitch-text-container ml-2">
              <span class="text-lg font-bold font-secondary glitch-text">VOIP Accelerator</span>
            </div>
          </RouterLink>
          <button type="button" class="-m-2.5 rounded-md p-2.5 text-neutral-300" @click="closeMenu">
            <span class="sr-only">Close menu</span>
            <XMarkIcon class="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div class="mt-6 flow-root">
          <div class="-my-6 divide-y divide-neutral-700">
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
  import { Bars3Icon, XMarkIcon, BoltIcon } from '@heroicons/vue/24/outline'; // Added BoltIcon
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
  /* Glitch effect styles copied from TopNav.vue */
  .glitch-container {
    position: relative;
    display: inline-block;
    /* color: black; */ /* Adjusted for white text */
  }

  .glitch-item {
    position: relative;
    z-index: 1;
    animation: glitch 3s ease-in-out infinite;
  }

  .glitch-text-container {
    position: relative;
    display: inline-block;
    /* color: black; */ /* Adjusted for white text */
  }

  .glitch-text {
    position: relative;
    z-index: 1;
    animation: textGlitch 3s ease-in-out infinite;
    color: white; /* Ensure text is white */
  }

  @keyframes glitch {
    0%,
    100% {
      transform: translate(0);
    }
    5% {
      transform: translate(-3px, 3px);
    }
    10% {
      transform: translate(-3px, -3px);
    }
    15% {
      transform: translate(3px, 3px);
    }
    20% {
      transform: translate(3px, -3px);
    }
    25% {
      transform: translate(-3px, 3px);
      filter: hue-rotate(90deg) brightness(1.2);
    }
    30% {
      transform: translate(3px, 3px);
    }
    35% {
      transform: translate(3px, -3px);
      filter: hue-rotate(0deg) brightness(1);
    }
    40% {
      transform: translate(-3px, -3px);
    }
    45% {
      transform: translate(-3px, 3px);
    }
    50% {
      transform: translate(0);
    }
    /* Rest period */
    55%,
    95% {
      transform: translate(0);
    }
  }

  @keyframes textGlitch {
    0%,
    100% {
      transform: translate(0);
      opacity: 1;
      text-shadow: none;
    }
    5% {
      transform: translate(-2px, 2px);
      opacity: 0.9;
    }
    10% {
      transform: translate(-2px, -2px);
      opacity: 1;
    }
    15% {
      transform: translate(2px, 2px);
      opacity: 0.8;
    }
    20% {
      transform: translate(2px, -2px);
      opacity: 1;
      /* Adjusted shadow colors for better visibility on dark bg */
      text-shadow:
        -2px 0 hsla(160, 40%, 60%, 0.7),
        2px 0 hsla(320, 60%, 50%, 0.7);
    }
    25% {
      transform: translate(-2px, 2px);
      opacity: 0.9;
    }
    30% {
      transform: translate(2px, 2px);
      opacity: 1;
      text-shadow:
        2px 0 hsla(160, 40%, 60%, 0.7),
        -2px 0 hsla(320, 60%, 50%, 0.7);
    }
    35% {
      transform: translate(2px, -2px);
      opacity: 0.9;
    }
    40% {
      transform: translate(-2px, -2px);
      opacity: 1;
      text-shadow: none;
    }
    45% {
      transform: translate(-2px, 2px);
      opacity: 0.9;
    }
    50% {
      transform: translate(0);
      opacity: 1;
    }
    /* Rest period */
    55%,
    95% {
      transform: translate(0);
      opacity: 1;
      text-shadow: none;
    }
  }
</style>
