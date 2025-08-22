<template>
  <!-- Step 1: Tier Selection -->
  <div v-if="props.currentStep === 'tier'">
    <TierSelectionStep @tier-selected="handleTierSelected" />
  </div>
  
  <!-- Step 2: Account Creation -->
  <form v-else-if="props.currentStep === 'account'" class="space-y-6" @submit.prevent="handleSignUp">
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
  
  // Props
  const props = defineProps<{
    currentStep: 'tier' | 'account';
  }>();
  
  // Emits
  const emit = defineEmits<{
    stepChange: [step: 'tier' | 'account'];
  }>();
  const selectedTier = ref<SubscriptionTier | null>(null);
  const isTrialSignup = ref(true); // Track if user selected trial path
  
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
  function handleTierSelected(tier: SubscriptionTier, isTrial = false) {
    selectedTier.value = tier;
    isTrialSignup.value = isTrial;
    console.log(`Tier selected: ${tier}, isTrial: ${isTrial}`);
    
    // Emit step change to parent
    emit('stepChange', 'account');
  }

  function getSignupButtonText() {
    if (!selectedTier.value) return 'Create Account';
    
    if (isTrialSignup.value) {
      return 'Start Free Trial';
    }
    
    const tierNames = {
      optimizer: 'Create Account - $99/month',
      accelerator: 'Create Account - $249/month',
      enterprise: 'Create Account - $499/month'
    };
    
    return tierNames[selectedTier.value] || 'Create Account';
  }
  
  function goBackToTierSelection() {
    clearMessages();
    
    // Emit step change to parent
    emit('stepChange', 'tier');
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
      // For both trial and paid users, create account first (they'll be redirected to billing after email confirmation for paid)
      const { error: signUpError } = await userStore.signUp(
        email.value, 
        password.value, 
        userAgent, 
        selectedTier.value, 
        isTrialSignup.value
      );

      if (signUpError) {
        console.error('Sign up error object:', signUpError);
        errorMessage.value = signUpError.message || 'Failed to create account. Please try again.';
      } else {
        // Success - show appropriate confirmation message based on signup type
        if (isTrialSignup.value) {
          signupSuccessMessage.value = `Account creation initiated! A confirmation email has been sent to ${email.value}. Please check your inbox (and spam folder) and click the link to start your 7-day free trial.`;
        } else {
          signupSuccessMessage.value = `Account creation initiated! A confirmation email has been sent to ${email.value}. Please check your inbox (and spam folder) and click the link to complete your account setup and proceed to billing.`;
        }
        isSignupFormSuccessfullySubmitted.value = true; // Disable button on success
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
