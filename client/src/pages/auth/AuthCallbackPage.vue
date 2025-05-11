<template>
  <div class="flex items-center justify-center min-h-screen bg-background text-foreground">
    <div class="text-center">
      <p v-if="errorMessage" class="text-lg font-semibold text-red-500">{{ errorMessage }}</p>
      <p v-else class="text-lg font-semibold animate-pulse">Processing authentication...</p>
      <!-- Optional: Add a spinner component here -->
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/stores/user-store'; // Assuming this path

  const router = useRouter();
  const userStore = useUserStore();
  const errorMessage = ref<string | null>(null);

  onMounted(() => {
    const hash = window.location.hash;

    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1)); // Remove '#' and parse
      const error = params.get('error');
      const errorDescription = params.get('error_description') || 'An unknown error occurred.';
      errorMessage.value = `Authentication failed: ${errorDescription.replace(/\+/g, ' ')} (Error: ${error})`;
      userStore.auth.error = new Error(errorMessage.value);
      console.error('[AuthCallbackPage] Error from URL hash:', errorMessage.value);

      // Redirect to login after a delay to allow the user to see the message
      setTimeout(() => {
        router.push({ name: 'Login' });
      }, 4000); // 4-second delay
      return;
    }

    // If no access_token and hash is minimal (e.g., just '#' or empty)
    // and user is not authenticated after a brief moment, redirect to login.
    // This handles cases where user lands here directly without an auth flow.
    if (!hash.includes('access_token=') && (hash === '#' || hash === '')) {
      console.warn('[AuthCallbackPage] Loaded without expected auth tokens in hash.');
      setTimeout(() => {
        // Re-check authentication state before redirecting
        // The onAuthStateChange might have just kicked in for a valid persistent session
        if (!userStore.getIsAuthenticated && router.currentRoute.value.name === 'AuthCallback') {
          errorMessage.value = 'Invalid authentication attempt. Redirecting to login...';
          console.log('[AuthCallbackPage] Redirecting to login due to missing auth context.');
          setTimeout(() => {
            router.push({ name: 'Login' });
          }, 2000);
        }
      }, 1500); // Wait a bit for onAuthStateChange to potentially resolve
      return;
    }

    // If access_token is present or other relevant hash (not an error),
    // the onAuthStateChange listener in user-store.ts and router guards
    // are expected to handle successful authentication and redirection.
    console.log(
      '[AuthCallbackPage] Processing authentication via onAuthStateChange and router guards.'
    );
  });

  // No specific script logic needed here initially beyond the onMounted hook.
  // Supabase handles the session via redirect hash fragments.
  // The onAuthStateChange listener in user-store.ts will detect the new session.
  // The router guards in router/index.ts will handle redirecting the user
  // away from this page once authenticated (or if there's an error).
</script>

<style scoped>
  /* Add any specific styles if needed, although Tailwind covers basics */
</style>
