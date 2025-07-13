<template>
  <div class="min-h-screen bg-zinc-950">
    <!-- Header -->
    <header class="bg-zinc-900 border-b border-zinc-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-white">VoIP Accelerator</h1>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-gray-300">{{ userEmail }}</span>
            <BaseButton @click="handleSignOut" variant="secondary" size="sm">
              Sign Out
            </BaseButton>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Trial Expired Message -->
      <div v-if="isExpired" class="text-center mb-12">
        <div class="mx-auto w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-6">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 class="text-4xl font-bold text-white mb-4">Your Trial Has Expired</h1>
        <p class="text-xl text-gray-400 max-w-2xl mx-auto">
          To continue using VoIP Accelerator and access all your rate sheet management tools, 
          please choose a subscription plan below.
        </p>
      </div>

      <!-- Active Trial Message -->
      <div v-else class="text-center mb-12">
        <div class="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-4xl font-bold text-white mb-4">Upgrade Your Account</h1>
        <p class="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
          You have {{ daysRemaining }} day{{ daysRemaining !== 1 ? 's' : '' }} remaining in your free trial.
        </p>
        <p class="text-lg text-gray-500">
          Upgrade now to ensure uninterrupted access to all features.
        </p>
      </div>

      <!-- Features Section -->
      <div class="mb-12">
        <h2 class="text-2xl font-bold text-white text-center mb-8">Everything You Need to Accelerate Your VoIP Business</h2>
        <div class="grid md:grid-cols-3 gap-8 mb-12">
          <div class="text-center">
            <div class="bg-blue-600 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">Unlimited Rate Sheets</h3>
            <p class="text-gray-400">Upload and analyze unlimited rate sheets with advanced comparison tools.</p>
          </div>
          
          <div class="text-center">
            <div class="bg-green-600 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">Advanced Analytics</h3>
            <p class="text-gray-400">Get insights into your rate deck performance and optimization opportunities.</p>
          </div>
          
          <div class="text-center">
            <div class="bg-purple-600 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">Bulk Operations</h3>
            <p class="text-gray-400">Make bulk adjustments and export data in multiple formats efficiently.</p>
          </div>
        </div>
      </div>

      <!-- Pricing Cards -->
      <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
        <!-- Monthly Plan -->
        <div class="bg-zinc-900 rounded-xl p-8 border-2 border-zinc-800 hover:border-zinc-700 transition-all">
          <div class="text-center">
            <h3 class="text-2xl font-bold text-white mb-2">Monthly</h3>
            <div class="mb-6">
              <span class="text-5xl font-bold text-white">$40</span>
              <span class="text-gray-400 text-xl">/month</span>
            </div>
            
            <ul class="space-y-3 text-left mb-8">
              <li class="flex items-center text-gray-300">
                <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                All features included
              </li>
              <li class="flex items-center text-gray-300">
                <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Cancel anytime
              </li>
              <li class="flex items-center text-gray-300">
                <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Priority support
              </li>
            </ul>
            
            <BaseButton
              @click="selectPlan('monthly')"
              variant="primary"
              size="lg"
              class="w-full"
              :loading="loading"
            >
              Choose Monthly
            </BaseButton>
          </div>
        </div>

        <!-- Annual Plan -->
        <div class="bg-zinc-900 rounded-xl p-8 border-2 border-blue-500 hover:border-blue-400 transition-all relative">
          <!-- Best Value Badge -->
          <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span class="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-full">
              BEST VALUE - SAVE 17%
            </span>
          </div>
          
          <div class="text-center">
            <h3 class="text-2xl font-bold text-white mb-2">Annual</h3>
            <div class="mb-2">
              <span class="text-5xl font-bold text-white">$400</span>
              <span class="text-gray-400 text-xl">/year</span>
            </div>
            <p class="text-blue-400 text-lg mb-6">Just $33.33/month</p>
            
            <ul class="space-y-3 text-left mb-8">
              <li class="flex items-center text-gray-300">
                <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                All features included
              </li>
              <li class="flex items-center text-gray-300">
                <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                2 months free
              </li>
              <li class="flex items-center text-gray-300">
                <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Priority support
              </li>
            </ul>
            
            <BaseButton
              @click="selectPlan('annual')"
              variant="primary"
              size="lg"
              class="w-full"
              :loading="loading"
            >
              Choose Annual
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Return to Dashboard Button (if trial still active) -->
      <div v-if="!isExpired" class="text-center">
        <BaseButton
          @click="handleReturnToDashboard"
          variant="secondary"
          size="lg"
        >
          Return to Dashboard
        </BaseButton>
      </div>
    </main>

    <!-- Footer -->
    <footer class="text-center py-8 text-gray-500 text-sm">
      <p>Secure payment processing by Stripe. Cancel anytime.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useBilling } from '@/composables/useBilling';
import { useUserStore } from '@/stores/user-store';
import BaseButton from '@/components/shared/BaseButton.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { 
  createCheckoutSession, 
  getDaysRemainingInTrial, 
  currentPlan, 
  loading 
} = useBilling();

const userEmail = computed(() => userStore.getUser?.email || '');
const daysRemaining = computed(() => getDaysRemainingInTrial());
const isExpired = computed(() => daysRemaining.value <= 0 && currentPlan.value === 'trial');

async function selectPlan(plan: 'monthly' | 'annual') {
  await createCheckoutSession(plan);
}

function handleReturnToDashboard() {
  const redirectPath = route.query.redirect as string;
  router.push(redirectPath || '/dashboard');
}

async function handleSignOut() {
  await userStore.signOut();
  router.push('/');
}

onMounted(() => {
  // Check if user already has active subscription
  if (currentPlan.value === 'monthly' || currentPlan.value === 'annual') {
    handleReturnToDashboard();
  }
});
</script>