<template>
  <header
    ref="header"
    class="z-[100] w-full transition-all duration-300 py-12"
    :class="{
      'translate-y-0': isVisible,
      '-translate-y-full': !isVisible,
      'bg-fbBlack/90 backdrop-blur-sm': hasScrolled,
    }"
  >
    <nav class="flex justify-between items-center w-full">
      <RouterLink
        to="/home"
        class="flex items-center text-accent"
      >
        <BoltIcon class="w-6 h-6" />
        <span class="text-lg font-medium ml-2">VOIP Accelerator</span>
      </RouterLink>

      <div class="flex items-center space-x-8">
        <RouterLink
          to="/pricing"
          class="text-fbWhite/90 hover:text-fbWhite transition-colors text-sm"
        >
          Pricing
        </RouterLink>
        <RouterLink
          to="/about"
          class="text-fbWhite/90 hover:text-fbWhite transition-colors text-sm"
        >
          About
        </RouterLink>
        <RouterLink
          to="/login"
          class="text-fbWhite/90 hover:text-fbWhite transition-colors text-sm"
        >
          Log in
        </RouterLink>
        <RouterLink
          to="/signup"
          class="bg-fbWhite text-fbBlack text-sm font-medium px-4 py-1.5 rounded hover:bg-fbWhite/90 transition-colors"
        >
          Sign up
        </RouterLink>
      </div>
    </nav>
  </header>

  <!-- Spacer to prevent content from being hidden under the fixed header -->
  <div class="h-14"></div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import { BoltIcon } from '@heroicons/vue/24/outline';
  import { RouterLink } from 'vue-router';

  const header = ref<HTMLElement | null>(null);
  const isVisible = ref(true);
  const hasScrolled = ref(false);
  let lastScrollY = 0;
  let scrollThreshold = 50; // Show background after scrolling this many pixels
  let scrollDistance = 20; // Only hide after scrolling down this much

  function handleScroll() {
    const currentScrollY = window.scrollY;

    // Set the background based on scroll position
    hasScrolled.value = currentScrollY > scrollThreshold;

    // Determine if the navbar should be visible
    if (currentScrollY > lastScrollY + scrollDistance) {
      // Scrolling down
      isVisible.value = false;
    } else if (currentScrollY < lastScrollY - 5 || currentScrollY < scrollThreshold) {
      // Scrolling up or near the top
      isVisible.value = true;
    }

    lastScrollY = currentScrollY;
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check of scroll position
    handleScroll();
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });
</script>

<style scoped>
  /* Additional styling if needed */
</style>
