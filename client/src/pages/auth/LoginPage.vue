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
  import { RouterLink } from 'vue-router';
  import { BoltIcon } from '@heroicons/vue/24/solid';
  import SignInForm from '@/components/auth/SignInForm.vue'; // Assuming this path

  // Page-specific logic can be added here if needed
</script>
