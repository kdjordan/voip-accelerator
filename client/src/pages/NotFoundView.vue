<template>
  <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center text-center px-4">
    <h1 class="text-6xl md:text-8xl font-bold text-accent mb-4">404</h1>
    <h2 class="text-2xl md:text-4xl font-medium text-fbWhite/80 mb-8">Page Not Found</h2>
    <p class="text-lg text-fbWhite/70 mb-10 max-w-md">
      Oops! The page you're looking for doesn't seem to exist. Maybe it was moved, or you typed the
      address incorrectly.
    </p>
    <RouterLink
      to="/"
      class="bg-accent text-fbBlack font-medium px-8 py-3 rounded-3xl hover:bg-accent/90 transition-colors"
    >
      Go Back Home
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router';

  // No specific logic needed for the 404 page itself
</script>

<style scoped>
  /* Add any component-specific styles if needed */
  /* Using min-h-[calc(100vh-200px)] to roughly center content vertically, assuming footer/header height */
</style>
