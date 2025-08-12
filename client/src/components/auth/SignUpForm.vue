<template>
  <!-- Step 1: Tier Selection -->
  <div v-if="currentStep === 'tier'">
    <TierSelectionStep @tier-selected="handleTierSelected" />
  </div>
  
  <!-- Step 2: Account Creation -->
  <form v-else-if="currentStep === 'account'" class="space-y-6" @submit.prevent="handleSignUp">
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
        Create Account - {{ selectedTier || 'Free' }} Plan
      </BaseButton>
    </div>

    <!-- Optional: Add Social Logins - Hidden for now -->
    <!-- <div class="relative mt-10">
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
    </div> -->
    
    <!-- Back to Tier Selection -->
    <div class="mt-4">
      <button
        type="button"
        @click="goBackToTierSelection"
        class="text-sm text-gray-400 hover:text-white transition-colors"
      >
        ← Back to plan selection
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/stores/user-store';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import TierSelectionStep from '@/components/auth/TierSelectionStep.vue';
  import type { SubscriptionTier } from '@/types/user-types';

  const userStore = useUserStore();
  const router = useRouter();
  
  // Multi-step form state
  const currentStep = ref<'tier' | 'account'>('tier');
  const selectedTier = ref<SubscriptionTier | null>(null);
  
  // Expose currentStep for parent component
  defineExpose({
    currentStep
  });
  
  // Account creation form state
  const email = ref('');
  const password = ref('');
  const confirmPassword = ref('');
  const errorMessage = ref<string | null>(null);
  const signupSuccessMessage = ref<string | null>(null);
  const isLoading = ref(false);
  const isLoadingGoogle = ref(false);
  const isSignupFormSuccessfullySubmitted = ref(false);

  // Step navigation methods
  function handleTierSelected(tier: SubscriptionTier) {
    selectedTier.value = tier;
    currentStep.value = 'account';
    console.log(`Tier selected: ${tier}`);
  }
  
  function goBackToTierSelection() {
    currentStep.value = 'tier';
    clearMessages();
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

    if (!selectedTier.value) {
      errorMessage.value = 'Please select a plan first.';
      return;
    }

    isLoading.value = true;
    const userAgent = navigator.userAgent;

    try {
      const { error: signUpError } = await userStore.signUp(email.value, password.value, userAgent, selectedTier.value);

      if (signUpError) {
        console.error('Sign up error object:', signUpError);
        errorMessage.value = signUpError.message || 'Failed to create account. Please try again.';
      } else {
        // Success - include tier info in success message
        signupSuccessMessage.value = `Account creation initiated! A confirmation email has been sent to ${email.value}. Please check your inbox (and spam folder) and click the link to activate your ${selectedTier.value} plan trial.`;
        isSignupFormSuccessfullySubmitted.value = true; // Disable button on success
        
        // TODO: Store the selected tier in user's profile after email confirmation
        // This will need to be handled in the auth callback or profile creation
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
