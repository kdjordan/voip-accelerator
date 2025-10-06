<template>
  <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-white">
        Reset your password
      </h2>
      <p class="mt-2 text-center text-sm text-gray-400">
        Enter your email address and we'll send you a link to reset your password.
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
      </div>

      <!-- Form -->
      <form v-if="!successMessage" class="space-y-6" @submit.prevent="handleResetRequest">
        <div>
          <label for="email" class="block text-sm font-medium leading-6 text-gray-300">
            Email address
          </label>
          <div class="mt-2">
            <input
              v-model="email"
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
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
            {{ isLoading ? 'Sending...' : 'Send reset link' }}
          </BaseButton>
        </div>
      </form>

      <!-- Back to Sign In -->
      <p class="mt-10 text-center text-sm text-gray-400">
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
import { ref } from 'vue';
import { supabase } from '@/utils/supabase';
import BaseButton from '@/components/shared/BaseButton.vue';

const email = ref('');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

async function handleResetRequest() {
  isLoading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    successMessage.value = 'Check your email for a password reset link. It may take a few minutes to arrive.';
  } catch (error: any) {
    console.error('Password reset error:', error);
    errorMessage.value = error.message || 'Failed to send reset email. Please try again.';
  } finally {
    isLoading.value = false;
  }
}
</script>
