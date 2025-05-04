<template>
  <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <BoltIcon class="mx-auto h-10 w-auto text-accent" />
      <h2 class="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-white">
        Sign in to your account
      </h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
      <div class="bg-gray-800 px-6 py-12 shadow sm:rounded-lg sm:px-12 border border-gray-700/50">
        <SignInForm />
      </div>

      <p class="mt-10 text-center text-sm text-gray-400">
        Not a member?
        {{ ' ' }}
        <RouterLink
          :to="{ name: 'SignUp' }"
          class="font-semibold leading-6 text-accent hover:text-accent-hover"
          >Sign up for a free trial</RouterLink
        >
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router';
  import { BoltIcon } from '@heroicons/vue/24/solid';
  import SignInForm from '@/components/auth/SignInForm.vue'; // Assuming this path

  // Page-specific logic can be added here if needed
</script>
