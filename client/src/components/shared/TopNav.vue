<template>
  <nav
    class="flex justify-between items-center px-6 py-3 bg-fbBlack w-full sticky top-0 z-50 border-b border-fbBorder/10"
  >
    <RouterLink
      to="/homeview"
      class="flex items-center text-accent"
    >
      <BoltIcon class="w-6 h-6" />
      <span class="text-lg font-medium ml-2">VOIP Accelerator</span>
    </RouterLink>

    <div class="flex items-center">
      <RouterLink
        to="/azview"
        class="text-fbWhite/80 hover:text-fbWhite transition-colors text-sm px-4"
      >
        Pricing
      </RouterLink>
      <RouterLink
        to="/about"
        class="text-fbWhite/80 hover:text-fbWhite transition-colors text-sm px-4"
      >
        About
      </RouterLink>
      <div class="ml-4 flex items-center">
        <RouterLink
          to="/login"
          class="text-fbWhite/80 hover:text-fbWhite transition-colors text-sm px-4"
        >
          Log in
        </RouterLink>
        <RouterLink
          to="/signup"
          class="bg-fbWhite text-fbBlack ml-4 text-sm font-medium px-4 py-1.5 rounded hover:bg-fbWhite/90 transition-colors"
        >
          Sign up
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
  import { BoltIcon } from '@heroicons/vue/24/outline';
  import { RouterLink } from 'vue-router';
</script>
