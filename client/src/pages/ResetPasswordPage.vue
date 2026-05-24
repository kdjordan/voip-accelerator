<template>
  <div class="flex min-h-screen flex-1 items-center justify-center px-6 py-12 lg:px-8 bg-gray-900">
    <div class="w-full max-w-md">
      <div class="bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-700">
        <!-- Header -->
        <div class="text-center mb-8">
          <BoltIcon class="mx-auto h-10 w-auto text-accent mb-4" />
          <h2 class="text-2xl font-bold text-white">
            Set your new password
          </h2>
          <p class="mt-2 text-sm text-gray-400">
            Enter a new password for your account.
          </p>
        </div>

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
              :disabled="!token"
            >
              {{ isLoading ? 'Resetting...' : 'Reset password' }}
            </BaseButton>
          </div>
        </form>

        <!-- Back to Sign In -->
        <p v-if="!successMessage" class="mt-6 text-center text-sm text-gray-400">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { BoltIcon } from '@heroicons/vue/24/solid';
import { authClient } from '@/lib/auth';
import BaseButton from '@/components/shared/BaseButton.vue';

const route = useRoute();
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const token = ref<string>('');

onMounted(() => {
  const raw = route.query.token;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value === 'string' && value.length > 0) {
    token.value = value;
  } else {
    errorMessage.value =
      'Invalid or expired reset link. Please request a new password reset.';
  }
});

async function handlePasswordReset() {
  isLoading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    isLoading.value = false;
    return;
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters';
    isLoading.value = false;
    return;
  }

  if (!token.value) {
    errorMessage.value = 'Missing reset token. Please request a new password reset.';
    isLoading.value = false;
    return;
  }

  try {
    const { error } = await authClient.resetPassword({
      newPassword: password.value,
      token: token.value,
    });
    if (error) throw new Error(error.message ?? 'Failed to reset password');

    successMessage.value = 'Password reset successful! Redirecting to login...';
    password.value = '';
    confirmPassword.value = '';

    setTimeout(() => {
      window.location.href = '/login?passwordReset=success';
    }, 1500);
  } catch (error: any) {
    console.error('Password reset error:', error);
    errorMessage.value = error.message || 'Failed to reset password. Please try again.';
  } finally {
    isLoading.value = false;
  }
}
</script>
