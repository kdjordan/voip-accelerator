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
          <h2 class="text-2xl font-bold text-white">Sign in to your account</h2>
        </div>

        <!-- Session Terminated Message -->
        <div v-if="showSessionTerminatedMessage" class="mb-6 rounded-lg border border-blue-400/30 bg-blue-400/10 p-4">
          <p class="text-center text-sm text-blue-300">
            You've been logged out because you logged in on another device. Please sign in again.
          </p>
        </div>

        <!-- Password Reset Success Message -->
        <div v-if="showPasswordResetSuccess" class="mb-6 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4">
          <p class="text-center text-sm text-emerald-300">
            Password reset successful! Please sign in with your new password.
          </p>
        </div>

        <!-- Form -->
        <SignInForm />

        <!-- Links -->
        <p class="mt-6 text-center text-sm text-zinc-400">
          Not a member?
          {{ ' ' }}
          <RouterLink
            :to="{ name: 'SignUp' }"
            class="font-semibold leading-6 text-emerald-400 hover:text-emerald-300"
            >Sign up for free forever</RouterLink
          >
        </p>
        <div class="mt-4 text-center text-sm text-zinc-400">
          <RouterLink
            :to="{ path: '/' }"
            class="font-semibold leading-6 text-emerald-400 hover:text-emerald-300"
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
