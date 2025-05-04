<template>
  <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <BoltIcon class="mx-auto h-10 w-auto text-accent" />
      <h2 class="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-white">
        Create your account
      </h2>
      <p class="mt-2 text-center text-sm text-gray-400">Start your free trial today.</p>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
      <div class="bg-gray-800 px-6 py-12 shadow sm:rounded-lg sm:px-12 border border-gray-700/50">
        <SignUpForm />
      </div>

      <p class="mt-10 text-center text-sm text-gray-400">
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
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router';
  import { BoltIcon } from '@heroicons/vue/24/solid';
  import SignUpForm from '@/components/auth/SignUpForm.vue'; // Assuming this path

  // Page-specific logic can be added here if needed
</script>
