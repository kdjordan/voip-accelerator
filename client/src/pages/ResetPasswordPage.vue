<template>
  <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-white">
        Set your new password
      </h2>
      <p class="mt-2 text-center text-sm text-gray-400">
        Enter a new password for your account.
      </p>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <!-- Success Message -->
      <div v-if="successMessage" class="mb-6 rounded-md bg-green-900/50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-green-300">{{ successMessage }}</p>
          </div>
        </div>
        <div class="mt-4">
          <router-link to="/dashboard">
            <BaseButton variant="primary" class="w-full">
              Continue to Dashboard
            </BaseButton>
          </router-link>
        </div>
      </div>

      <!-- Form -->
      <form v-if="!successMessage" class="space-y-6" @submit.prevent="handlePasswordReset">
        <div>
          <label for="password" class="block text-sm font-medium leading-6 text-gray-300">
            New password
          </label>
          <div class="mt-2">
            <input
              v-model="password"
              id="password"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              minlength="6"
              class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6"
            />
          </div>
          <p class="mt-1 text-xs text-gray-400">Must be at least 6 characters</p>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium leading-6 text-gray-300">
            Confirm new password
          </label>
          <div class="mt-2">
            <input
              v-model="confirmPassword"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              minlength="6"
              class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div v-if="errorMessage" class="text-sm text-red-400">
          {{ errorMessage }}
        </div>

        <div>
          <BaseButton
            type="submit"
            :loading="isLoading"
            variant="primary"
            class="w-full"
          >
            {{ isLoading ? 'Resetting...' : 'Reset password' }}
          </BaseButton>
        </div>
      </form>

      <!-- Back to Sign In -->
      <p v-if="!successMessage" class="mt-10 text-center text-sm text-gray-400">
        Remember your password?
        <router-link
          to="/login"
          class="font-semibold leading-6 text-accent hover:text-accent-hover"
        >
          Sign in
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/utils/supabase';
import BaseButton from '@/components/shared/BaseButton.vue';

const router = useRouter();
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

onMounted(async () => {
  // Supabase automatically detects the recovery token in the URL hash
  // and exchanges it for a session. We need to wait a moment for this to happen.

  // Listen for auth state changes to detect when recovery session is ready
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      // Recovery session is ready - user can now reset password
      console.log('Password recovery session detected');
    } else if (event === 'SIGNED_OUT') {
      errorMessage.value = 'Invalid or expired reset link. Please request a new password reset.';
    }
  });

  // Also check for existing session (in case page was refreshed)
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Give Supabase a moment to process the URL hash
    setTimeout(async () => {
      const { data: { session: retrySession } } = await supabase.auth.getSession();
      if (!retrySession) {
        errorMessage.value = 'Invalid or expired reset link. Please request a new password reset.';
      }
    }, 1000);
  }

  // Clean up subscription when component unmounts
  return () => {
    subscription?.unsubscribe();
  };
});

async function handlePasswordReset() {
  isLoading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  // Validate passwords match
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    isLoading.value = false;
    return;
  }

  // Validate password length
  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters';
    isLoading.value = false;
    return;
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value
    });

    if (error) throw error;

    successMessage.value = 'Password reset successful! You are now logged in and can continue to your dashboard.';

    // Clear the form
    password.value = '';
    confirmPassword.value = '';
  } catch (error: any) {
    console.error('Password reset error:', error);
    errorMessage.value = error.message || 'Failed to reset password. Please try again.';
  } finally {
    isLoading.value = false;
  }
}
</script>
