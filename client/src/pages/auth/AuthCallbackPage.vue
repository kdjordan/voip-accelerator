<template>
  <div class="flex items-center justify-center min-h-screen bg-background text-foreground">
    <div class="text-center">
      <p class="text-lg font-semibold animate-pulse">Processing authentication...</p>
      <!-- Optional: Add a spinner component here -->
    </div>
  </div>
</template>

<script setup lang="ts">
  // No specific script logic needed here initially.
  // Supabase handles the session via redirect hash fragments.
  // The onAuthStateChange listener in user-store.ts will detect the new session.
  // The router guards in router/index.ts will handle redirecting the user
  // away from this page once authenticated (or if there's an error).

  // Potential enhancements:
  // - Add error handling based on URL hash fragments if Supabase indicates an error.
  // - Use onMounted to push to login if the user somehow lands here without a valid session starting.
</script>

<style scoped>
  /* Add any specific styles if needed, although Tailwind covers basics */
</style>
