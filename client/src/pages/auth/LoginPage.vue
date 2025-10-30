<template>
  <div class="flex min-h-screen flex-1 items-center justify-center px-6 py-12 lg:px-8 bg-gray-900">
    <div class="w-full max-w-md">
      <div class="bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-700">
        <!-- Header -->
        <div class="text-center mb-8">
          <BoltIcon class="mx-auto h-10 w-auto text-accent mb-4" />
          <h2 class="text-2xl font-bold text-white">
            Sign in to your account
          </h2>
        </div>

        <!-- Session Terminated Message -->
        <div v-if="showSessionTerminatedMessage" class="mb-6 bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
          <p class="text-sm text-blue-300 text-center">
            You've been logged out because you logged in on another device. Please sign in again.
          </p>
        </div>

        <!-- Password Reset Success Message -->
        <div v-if="showPasswordResetSuccess" class="mb-6 bg-green-900/30 border border-green-700/50 rounded-lg p-4">
          <p class="text-sm text-green-300 text-center">
            Password reset successful! Please sign in with your new password.
          </p>
        </div>

        <!-- Form -->
        <SignInForm />

        <!-- Links -->
        <p class="mt-6 text-center text-sm text-gray-400">
          Not a member?
          {{ ' ' }}
          <RouterLink
            :to="{ name: 'SignUp' }"
            class="font-semibold leading-6 text-accent hover:text-accent-hover"
            >Sign up for a free trial</RouterLink
          >
        </p>
        <div class="mt-4 text-center text-sm text-gray-400">
          <RouterLink
            :to="{ path: '/' }"
            class="font-semibold leading-6 text-accent hover:text-accent-hover"
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
  import { BoltIcon } from '@heroicons/vue/24/solid';
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
