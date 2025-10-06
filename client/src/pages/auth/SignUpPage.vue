<template>
  <div class="flex min-h-screen flex-1 items-center justify-center px-6 py-12 lg:px-8 bg-gray-900">
    <div class="w-full max-w-md">
      <div class="bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-700">
        <!-- Header -->
        <div class="text-center mb-8">
          <BoltIcon class="mx-auto h-10 w-auto text-accent mb-4" />
          <h2 class="text-2xl font-bold text-white">
            Start Your Free Trial
          </h2>
          <p class="mt-2 text-sm text-gray-400">
            7-day free trial. No credit card required.
          </p>
        </div>

        <!-- Form -->
        <SignUpForm ref="signUpForm" />

        <!-- Links -->
        <p class="mt-6 text-center text-sm text-gray-400">
          Already a member?
          {{ ' ' }}
          <RouterLink
            :to="{ name: 'Login' }"
            class="font-semibold leading-6 text-accent hover:text-accent-hover"
            >Sign in here</RouterLink
          >
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { RouterLink } from 'vue-router';
  import { BoltIcon } from '@heroicons/vue/24/solid';
  import SignUpForm from '@/components/auth/SignUpForm.vue';

  // Reference to the SignUpForm component to access its state
  const signUpForm = ref<InstanceType<typeof SignUpForm> | null>(null);
</script>
