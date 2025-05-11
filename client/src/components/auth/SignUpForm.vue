<template>
  <form class="space-y-6" @submit.prevent="handleSignUp">
    <div>
      <label for="email" class="block text-sm font-medium leading-6 text-gray-300"
        >Email address</label
      >
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

    <div>
      <label for="password" class="block text-sm font-medium leading-6 text-gray-300"
        >Password</label
      >
      <div class="mt-2">
        <input
          v-model="password"
          id="password"
          name="password"
          type="password"
          autocomplete="new-password"
          required
          :minlength="minPasswordLength"
          class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6"
        />
        <p
          v-if="password && password.length < minPasswordLength"
          class="mt-1 text-xs text-yellow-400"
        >
          Password must be at least {{ minPasswordLength }} characters long.
        </p>
      </div>
    </div>

    <div>
      <label for="confirm-password" class="block text-sm font-medium leading-6 text-gray-300"
        >Confirm Password</label
      >
      <div class="mt-2">
        <input
          v-model="confirmPassword"
          id="confirm-password"
          name="confirm-password"
          type="password"
          autocomplete="new-password"
          required
          class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6"
        />
        <p
          v-if="password && confirmPassword && password !== confirmPassword"
          class="mt-1 text-xs text-red-400"
        >
          Passwords do not match.
        </p>
      </div>
    </div>

    <div v-if="errorMessage" class="mt-4 text-center text-sm text-red-400">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="mt-4 text-center text-sm text-green-400">
      {{ successMessage }}
    </div>

    <div>
      <BaseButton
        type="submit"
        :is-loading="isLoading"
        :disabled="isLoading || password !== confirmPassword || password.length < minPasswordLength"
        class="w-full"
      >
        {{ isLoading ? 'Creating account...' : 'Create Account' }}
      </BaseButton>
    </div>

    <!-- Optional: Add Social Logins 
    <div class="relative mt-10">
      <div class="absolute inset-0 flex items-center" aria-hidden="true">
        <div class="w-full border-t border-white/10" />
      </div>
      <div class="relative flex justify-center text-sm font-medium leading-6">
        <span class="bg-gray-800 px-6 text-gray-400">Or sign up with</span>
      </div>
    </div>
    <div class="mt-6">
      <BaseButton
        @click="handleGoogleSignUp"
        :is-loading="isLoadingGoogle"
        variant="secondary"
        class="w-full"
      >
        <span class="sr-only">Sign up with Google</span>
        
        Sign up with Google
      </BaseButton>
    </div>
    -->
  </form>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/stores/user-store';
  import BaseButton from '@/components/shared/BaseButton.vue';

  const email = ref('');
  const password = ref('');
  const confirmPassword = ref('');
  const isLoading = ref(false);
  const isLoadingGoogle = ref(false);
  const errorMessage = ref<string | null>(null);
  const successMessage = ref<string | null>(null);
  const minPasswordLength = 6; // Supabase default minimum password length

  const userStore = useUserStore();
  const router = useRouter();

  async function handleSignUp() {
    errorMessage.value = null;
    successMessage.value = null; // Clear previous success messages
    if (!validateForm()) return;

    isLoading.value = true;
    const userAgent = navigator.userAgent || 'Unknown User Agent';

    try {
      // Pass userAgent as the third argument directly
      const { error } = await userStore.signUp(email.value, password.value, userAgent);
      if (error) {
        successMessage.value = null; // Clear success message if there was an error
        throw error;
      }
      // Handle success (e.g., show confirmation message, redirect)
      // console.log('Signup process initiated. Check email if confirmation is needed.');
      errorMessage.value = null; // Clear any previous errors
      successMessage.value = `Account creation initiated! A confirmation email has been sent to ${email.value}. Please check your inbox (and spam folder) and click the link to activate your account.`;

      // Optional: Reset form fields after a delay or leave them for user reference
      // email.value = '';
      // password.value = '';
      // confirmPassword.value = '';

      // Consider disabling the form or button further if needed, though isLoading handles the button.
    } catch (err: any) {
      console.error('Sign up error:', err);
      successMessage.value = null; // Clear success message if there was an error
      errorMessage.value = err.message || 'Sign up failed. Please try again.';
    } finally {
      isLoading.value = false;
    }
  }

  async function handleGoogleSignUp() {
    isLoadingGoogle.value = true;
    errorMessage.value = null;
    try {
      //signInWithGoogle throws on error or redirects on success
      await userStore.signInWithGoogle();
      // If it doesn't throw or redirect, something unexpected happened, but we often don't reach here on success.
      // The redirect/state change is primarily handled by the Supabase callback and onAuthStateChange listener.
    } catch (err: any) {
      console.error('Google sign up error:', err);
      errorMessage.value = err.message || 'Could not sign up with Google.';
    } finally {
      // Reset loading state regardless of success or failure
      isLoadingGoogle.value = false;
    }
  }

  function validateForm() {
    if (password.value !== confirmPassword.value || password.value.length < minPasswordLength) {
      errorMessage.value = 'Please ensure passwords match and meet the length requirement.';
      return false;
    }
    return true;
  }
</script>
