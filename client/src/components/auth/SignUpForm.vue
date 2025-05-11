<template>
  <form class="space-y-6" @submit.prevent="handleSignUp">
    <div>
      <label for="email" class="block text-sm font-medium leading-6 text-text-primary"
        >Email address</label
      >
      <div class="mt-2">
        <input
          id="email"
          v-model="email"
          name="email"
          type="email"
          autocomplete="email"
          required
          class="form-input block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6 bg-background-secondary text-text-primary placeholder-text-secondary"
          placeholder="you@example.com"
          @input="clearMessages"
        />
      </div>
    </div>

    <div>
      <label for="password" class="block text-sm font-medium leading-6 text-text-primary"
        >Password</label
      >
      <div class="mt-2">
        <input
          id="password"
          v-model="password"
          name="password"
          type="password"
          autocomplete="new-password"
          required
          class="form-input block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6 bg-background-secondary text-text-primary placeholder-text-secondary"
          placeholder="••••••••"
          @input="clearMessages"
        />
      </div>
    </div>

    <div>
      <label for="confirmPassword" class="block text-sm font-medium leading-6 text-text-primary"
        >Confirm Password</label
      >
      <div class="mt-2">
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          name="confirmPassword"
          type="password"
          autocomplete="new-password"
          required
          class="form-input block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6 bg-background-secondary text-text-primary placeholder-text-secondary"
          placeholder="••••••••"
          @input="clearMessages"
        />
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-md text-sm"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="signupSuccessMessage"
      class="mt-6 p-4 bg-green-500/10 border border-green-500/30 text-green-300 rounded-md text-sm"
    >
      {{ signupSuccessMessage }}
    </div>

    <div>
      <button
        type="submit"
        :disabled="isLoading || isSignupFormSuccessfullySubmitted"
        class="flex w-full justify-center rounded-md bg-accent px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isLoading">Processing...</span>
        <span v-else>Create Account</span>
      </button>
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

  const userStore = useUserStore();
  const router = useRouter();
  const email = ref('');
  const password = ref('');
  const confirmPassword = ref('');
  const errorMessage = ref<string | null>(null);
  const signupSuccessMessage = ref<string | null>(null);
  const isLoading = ref(false);
  const isLoadingGoogle = ref(false);
  const isSignupFormSuccessfullySubmitted = ref(false);

  async function handleSignUp() {
    clearMessages(); // Clear messages at the start of a new attempt

    if (password.value !== confirmPassword.value) {
      errorMessage.value = 'Passwords do not match.';
      return;
    }

    if (password.value.length < 8) {
      errorMessage.value = 'Password must be at least 8 characters long.';
      return;
    }

    isLoading.value = true;
    const userAgent = navigator.userAgent;

    try {
      const { error: signUpError } = await userStore.signUp(email.value, password.value, userAgent);

      if (signUpError) {
        console.error('Sign up error object:', signUpError);
        errorMessage.value = signUpError.message || 'Failed to create account. Please try again.';
      } else {
        // Success
        signupSuccessMessage.value = `Account creation initiated! A confirmation email has been sent to ${email.value}. Please check your inbox (and spam folder) and click the link to activate your account.`;
        isSignupFormSuccessfullySubmitted.value = true; // Disable button on success
        // Optionally clear form fields, though user might want to see the email they used
        // email.value = '';
        // password.value = '';
        // confirmPassword.value = '';
      }
    } catch (error) {
      // Catch any unexpected errors from the signUp action itself
      console.error('Unexpected error during sign up:', error);
      errorMessage.value = 'An unexpected error occurred. Please try again.';
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

  function clearMessages() {
    errorMessage.value = null;
    signupSuccessMessage.value = null;
    isSignupFormSuccessfullySubmitted.value = false;
  }
</script>
