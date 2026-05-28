<template>
  <div class="flex min-h-screen flex-1 items-center justify-center bg-canvas px-6 py-12 text-fg-dim lg:px-8">
    <div class="w-full max-w-md">
      <div class="border border-line bg-surface p-8">
        <!-- Header -->
        <div class="mb-8 text-center">
          <div class="mb-5 flex justify-center">
            <VoipLogo />
          </div>
          <h2 class="font-display text-2xl font-semibold tracking-tight text-fg">Sign in to your account</h2>
        </div>

        <!-- Session Terminated Message -->
        <div v-if="showSessionTerminatedMessage" class="mb-6 border border-info bg-info-soft p-4">
          <p class="text-center text-sm text-info">
            You've been logged out because you logged in on another device. Please sign in again.
          </p>
        </div>

        <!-- Password Reset Success Message -->
        <div v-if="showPasswordResetSuccess" class="mb-6 border border-warn bg-warn-soft p-4">
          <p class="text-center text-sm text-warn">
            Password reset successful! Please sign in with your new password.
          </p>
        </div>

        <!-- Form -->
        <SignInForm />

        <!-- Links -->
        <p class="mt-6 text-center text-sm text-fg-faint">
          Not a member?
          {{ ' ' }}
          <RouterLink
            :to="{ name: 'SignUp' }"
            class="font-semibold leading-6 text-accent hover:text-accent-text"
            >Sign up for free forever</RouterLink
          >
        </p>
        <div class="mt-4 text-center text-sm text-fg-faint">
          <RouterLink
            :to="{ path: '/' }"
            class="font-semibold leading-6 text-accent hover:text-accent-text"
            >Home</RouterLink
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { RouterLink, useRoute } from 'vue-router';
  import VoipLogo from '@/components/shared/VoipLogo.vue';
  import SignInForm from '@/components/auth/SignInForm.vue';

  const route = useRoute();

  // Show message if user was logged out due to session termination
  const showSessionTerminatedMessage = computed(() => {
    return route.query.reason === 'session_terminated';
  });

  // Show message if password was successfully reset
  const showPasswordResetSuccess = computed(() => {
    return route.query.passwordReset === 'success';
  });
</script>
