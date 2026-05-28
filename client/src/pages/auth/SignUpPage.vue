<template>
  <div class="flex min-h-screen flex-1 items-center justify-center bg-canvas px-6 py-12 text-fg-dim lg:px-8">
    <div class="w-full max-w-md">
      <div class="border border-line bg-surface p-8">
        <!-- Header -->
        <div class="mb-8 text-center">
          <div class="mb-5 flex justify-center">
            <VoipLogo />
          </div>
          <h2 class="font-display text-2xl font-semibold tracking-tight text-fg">Create Your Free Account</h2>
          <p class="mt-2 text-sm text-fg-faint">Free forever. No credit card required.</p>
        </div>

        <!-- Form -->
        <SignUpForm ref="signUpForm" />

        <!-- Links -->
        <p class="mt-6 text-center text-sm text-fg-faint">
          Already a member?
          {{ ' ' }}
          <RouterLink
            :to="{ name: 'Login' }"
            class="font-semibold leading-6 text-accent hover:text-accent-text"
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
  import VoipLogo from '@/components/shared/VoipLogo.vue';
  import SignUpForm from '@/components/auth/SignUpForm.vue';

  // Reference to the SignUpForm component to access its state
  const signUpForm = ref<InstanceType<typeof SignUpForm> | null>(null);
</script>
