<template>
  <header
    ref="header"
    class="fixed top-0 left-0 right-0 z-[100] w-full transition-transform duration-500"
    :style="{ transform: isVisible ? 'translateY(0)' : 'translateY(-100%)' }"
  >
    <nav
      class="flex justify-between items-center px-6 h-14 bg-fbBlack/95 w-full border-b border-fbBorder/10 backdrop-blur-sm"
    >
      <RouterLink
        to="/home"
        class="flex items-center text-accent"
      >
        <BoltIcon class="w-5 h-5" />
        <span class="ml-2 font-medium">VOIP Accelerator</span>
      </RouterLink>

      <div class="flex items-center space-x-6">
        <RouterLink
          to="/azview"
          class="text-fbWhite/80 hover:text-fbWhite transition-colors text-sm"
        >
          Pricing
        </RouterLink>
        <RouterLink
          to="/azview"
          class="text-fbWhite/80 hover:text-fbWhite transition-colors text-sm"
        >
          About
        </RouterLink>
        <RouterLink
          to="/azview"
          class="text-fbWhite/80 hover:text-fbWhite transition-colors text-sm"
        >
          Log in
        </RouterLink>
        <RouterLink
          to="/azview"
          class="bg-fbWhite text-fbBlack text-sm font-medium px-3 py-1 rounded hover:bg-fbWhite/90 transition-colors"
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
  let lastScrollY = window.scrollY;

  function handleScroll() {
    const currentScrollY = window.scrollY;
    console.log('Current scroll position:', currentScrollY);

    if (currentScrollY > lastScrollY) {
      console.log('Scrolling down');
      isVisible.value = false;
    } else {
      console.log('Scrolling up');
      isVisible.value = true;
    }

    lastScrollY = currentScrollY;
  }

  onMounted(() => {
    console.log('TopNav mounted');
    window.addEventListener('scroll', handleScroll, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });
</script>

<style scoped>

</style>
