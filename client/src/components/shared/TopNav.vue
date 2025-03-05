<template>
  <header
    ref="header"
    class="z-[100] px-24 mx-auto pb-12"
  >
    <nav class="flex justify-between items-center w-full">
      <RouterLink
        to="/home"
        class="flex items-center text-fbBlack"
      >
        <BoltIcon class="w-8 h-8" />
        <span class="text-sizeLg font-medium ml-2 tracking-wider">VOIP Accelerator</span>
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

  
</script>

<style scoped>
  /* Additional styling if needed */
</style>
