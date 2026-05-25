<template>
  <!-- Account Creation Form -->
  <form class="space-y-6" @submit.prevent="handleSignUp">
    <div>
      <label for="email" class="block text-sm font-medium leading-6 text-gray-300"
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
          class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6"
          @input="clearMessages"
        />
      </div>
    </div>

    <div>
      <label for="password" class="block text-sm font-medium leading-6 text-gray-300"
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
          class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6"
          @input="clearMessages"
        />
      </div>
    </div>

    <div>
      <label for="confirm-password" class="block text-sm font-medium leading-6 text-gray-300"
        >Confirm Password</label
      >
      <div class="mt-2">
        <input
          id="confirm-password"
          v-model="confirmPassword"
          name="confirm-password"
          type="password"
          autocomplete="new-password"
          required
          class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6"
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
      <BaseButton
        type="submit"
        variant="primary"
        class="w-full"
        :loading="isLoading"
        :disabled="isLoading || isSignupFormSuccessfullySubmitted"
      >
        {{ getSignupButtonText() }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/stores/user-store';
  import BaseButton from '@/components/shared/BaseButton.vue';

  const userStore = useUserStore();
  const router = useRouter();

  // Account creation form state
  const email = ref('');
  const password = ref('');
  const confirmPassword = ref('');
  const errorMessage = ref<string | null>(null);
  const signupSuccessMessage = ref<string | null>(null);
  const isLoading = ref(false);
  const isSignupFormSuccessfullySubmitted = ref(false);

  function getSignupButtonText() {
    return 'Create Account';
  }

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
      const { error: signUpError } = await userStore.signUp(
        email.value,
        password.value,
        userAgent
      );

      if (signUpError) {
        console.error('Sign up error object:', signUpError);
        errorMessage.value = signUpError.message || 'Failed to create account. Please try again.';
      } else {
        // better-auth signs the user in on sign-up (session returned) and there
        // is no email verification, so go straight to the app — same as sign-in.
        isSignupFormSuccessfullySubmitted.value = true;
        router.push((router.currentRoute.value.query.redirect as string) || '/dashboard');
      }
    } catch (error) {
      // Catch any unexpected errors from the signUp action itself
      console.error('Unexpected error during sign up:', error);
      errorMessage.value = 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading.value = false;
    }
  }

  function clearMessages() {
    errorMessage.value = null;
    signupSuccessMessage.value = null;
    isSignupFormSuccessfullySubmitted.value = false;
  }
</script>
