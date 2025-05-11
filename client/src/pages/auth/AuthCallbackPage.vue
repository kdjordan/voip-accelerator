<template>
  <div class="flex items-center justify-center min-h-screen bg-background text-accent bg-green-900/10 border border-green-900/30 p-4 rounded-md">
    <div class="text-center">
      <p v-if="errorMessage" class="text-lg font-semibold text-red-500">{{ errorMessage }}</p>
      <p v-else class="text-lg font-semibold animate-pulse">Processing authentication...</p>
      <!-- Optional: Add a spinner component here -->
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref, watchEffect } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/stores/user-store'; // Assuming this path

  const router = useRouter();
  const userStore = useUserStore();
  const errorMessage = ref<string | null>(null);

  onMounted(() => {
    console.log(
      '[AuthCallbackPage] Mounted. Current URL:',
      window.location.href,
      'Current hash:',
      window.location.hash
    );
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
        // Check if still on AuthCallback before redirecting, in case another redirect happened
        if (router.currentRoute.value.name === 'AuthCallback') {
          router.replace({ name: 'Login' });
        }
      }, 4000); // 4-second delay
      return; // Important: return if there's an error from hash
    }

    // If no error in hash, watchEffect will handle redirection based on store state.
    // The old logic for "missing auth context" or timeouts if no access_token is present
    // is removed as the watchEffect is more robust.
    console.log(
      '[AuthCallbackPage] No immediate error in hash. Awaiting store state changes via watchEffect.'
    );
  });

  watchEffect(() => {
    console.log(
      '[AuthCallbackPage] watchEffect triggered. isAuthenticated:',
      userStore.getIsAuthenticated,
      'isInitialized:',
      userStore.getAuthIsInitialized,
      'Current route:',
      router.currentRoute.value.name,
      'Error message ref:',
      errorMessage.value
    );

    // Only proceed if we are still on the AuthCallback page AND no error message was set from the URL hash
    if (router.currentRoute.value.name === 'AuthCallback' && !errorMessage.value) {
      if (userStore.getAuthIsInitialized) {
        if (userStore.getIsAuthenticated) {
          console.log(
            '[AuthCallbackPage] User authenticated and store initialized. Redirecting to dashboard.'
          );
          router.replace({ name: 'dashboard' }); // Use replace to avoid callback page in history
        } else {
          // Store is initialized, but user is not authenticated.
          // This implies the authentication process (e.g., profile fetch) might have failed
          // and led to a sign-out within the store, or an explicit sign-out happened.
          console.log(
            '[AuthCallbackPage] Store initialized, but user not authenticated. Redirecting to Login.'
          );
          router.replace({ name: 'Login' });
        }
      }
      // If not yet initialized, watchEffect will run again when userStore.getAuthIsInitialized changes.
      // No explicit action needed here; the component will continue to show "Processing...".
    }
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
