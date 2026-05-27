<template>
  <div class="flex min-h-screen flex-1 items-center justify-center bg-ink px-6 py-12 text-zinc-300 lg:px-8">
    <div class="w-full max-w-md">
      <div class="rounded-2xl border border-white/[0.07] bg-ink-raised p-8 shadow-2xl shadow-emerald-950/20">
        <!-- Header -->
        <div class="mb-8 text-center">
          <span
            class="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/30"
          >
            <BoltIcon class="h-6 w-6 text-emerald-400" />
          </span>
          <h2 class="text-2xl font-bold text-white">Create Your Free Account</h2>
          <p class="mt-2 text-sm text-zinc-400">Free forever. No credit card required.</p>
        </div>

        <!-- Form -->
        <SignUpForm ref="signUpForm" />

        <!-- Links -->
        <p class="mt-6 text-center text-sm text-zinc-400">
          Already a member?
          {{ ' ' }}
          <RouterLink
            :to="{ name: 'Login' }"
            class="font-semibold leading-6 text-emerald-400 hover:text-emerald-300"
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
