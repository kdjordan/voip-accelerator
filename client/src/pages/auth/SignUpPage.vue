<template>
  <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
    <!-- Only show header for account creation step, not tier selection -->
    <div v-if="currentStep !== 'tier'" class="sm:mx-auto sm:w-full sm:max-w-md">
      <BoltIcon class="mx-auto h-10 w-auto text-accent" />
      <h2 class="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-white">
        Create your account
      </h2>
      <p class="mt-2 text-center text-sm text-gray-400">
        Enter your details to get started.
      </p>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full" :class="currentStep === 'tier' ? 'max-w-6xl px-4' : 'sm:max-w-[480px]'">
      <!-- Single SignUpForm component with conditional styling -->
      <div :class="currentStep === 'tier' ? 'bg-gray-800 px-8 py-12 shadow-xl sm:rounded-lg border border-gray-700/50' : 'bg-gray-800 px-6 py-12 shadow sm:rounded-lg sm:px-12 border border-gray-700/50'">
        <SignUpForm ref="signUpForm" @step-change="handleStepChange" :current-step="currentStep" />
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
  import { ref, computed } from 'vue';
  import { RouterLink } from 'vue-router';
  import { BoltIcon } from '@heroicons/vue/24/solid';
  import SignUpForm from '@/components/auth/SignUpForm.vue';

  // Reference to the SignUpForm component to access its state
  const signUpForm = ref<InstanceType<typeof SignUpForm> | null>(null);
  
  // Local state for current step instead of computed
  const currentStep = ref<'tier' | 'account'>('tier');
  
  // Handle step changes from child component
  const handleStepChange = (step: 'tier' | 'account') => {
    console.log('SignUpPage handleStepChange:', step);
    currentStep.value = step;
  };
</script>
