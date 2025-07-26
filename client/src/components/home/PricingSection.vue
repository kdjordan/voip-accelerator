<template>
  <!-- Outer container with black background and thin margin -->
  <section class="p-[5px] bg-fbBlack relative overflow-hidden">
    <!-- Inner container with rounded-3xl and green gradient background -->
    <div
      class="bg-gradient-to-br from-accent/80 via-accent/30 to-fbBlack rounded-3xl pt-16 pb-16 md:py-24 relative overflow-hidden"
    >
      <!-- Abstract accent shapes for visual interest -->
      <div
        class="absolute -top-32 -left-32 w-64 h-64 bg-accent/30 rounded-full blur-3xl opacity-70"
      ></div>
      <div
        class="absolute top-1/4 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-50"
      ></div>
      <div
        class="absolute bottom-0 left-1/3 w-72 h-72 bg-accent/20 rounded-full blur-3xl opacity-40"
      ></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center mb-12 md:mb-12">
          <h2 class="text-3xl md:text-4xl text-fbWhite sm:text-5xl font-secondary">
            Simple, Transparent Pricing
          </h2>
          <p class="text-xl md:text-2xl text-fbWhite/90 mt-4">
            Upload Decks. Unlock Profits. Repeat.
          </p>
        </div>

        <!-- Pricing Toggle -->
        <!-- <div class="flex justify-center mb-8 md:mb-12">
          <PricingToggle v-model="isMonthly" />
        </div> -->

        <!-- Pricing card with bento box styling -->
        <div class="flex justify-center">
          <div
            v-for="plan in pricingPlans"
            :key="plan.id"
            class="flex flex-col rounded-3xl border border-accent/30 bg-fbBlack w-full max-w-md transition-all duration-300 hover:border-accent/50"
          >
            <!-- Card content with enhanced styling -->
            <div class="p-8 md:p-10 flex-grow">
              <!-- Pricing Toggle -->
              <div class="flex justify-center mb-6">
                <PricingToggle v-model="isMonthly" />
              </div>

              <!-- Price highlight section -->
              <div class="mb-8 flex items-end justify-between">
                <!-- Container for price and period -->
                <div class="flex items-baseline">
                  <span class="text-5xl md:text-6xl font-bold text-accent">
                    {{ displayPrice(plan) }}
                  </span>
                  <span class="text-base font-medium text-fbWhite/60 ml-2">
                    {{ isMonthly ? '/month' : '/year' }}
                  </span>
                </div>
                <!-- Animated Savings Circle -->
                <div
                  ref="savingsCircleRef"
                  v-show="!isMonthly && yearlySavings > 0"
                  class="ml-3 w-24 h-24 flex flex-col items-center justify-center rounded-full bg-blue-900/30 border border-blue-700/50 text-blue-300 font-semibold opacity-0 transform scale-0"
                >
                  <span>Save</span>
                  <span>${{ yearlySavings }}/yr!</span>
                </div>
              </div>

              <div
                class="h-px w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent my-8"
              ></div>

              <ul role="list" class="mt-6 space-y-4">
                <li v-for="feature in plan.features" :key="feature" class="flex items-start">
                  <svg
                    class="flex-shrink-0 h-6 w-6 text-accent mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span class="ml-3 text-base md:text-lg text-fbWhite/90">{{ feature }}</span>
                </li>
              </ul>
            </div>

            <div class="p-8 md:p-10 rounded-b-3xl mt-auto">
              <button
                @click="handleSubscribe(plan)"
                :disabled="isProcessing"
                class="block w-full rounded-3xl px-6 py-4 text-center text-base md:text-lg font-semibold transition-all duration-300 bg-accent/20 text-accent border border-accent/50 hover:bg-accent/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isProcessing">Processing...</span>
                <span v-else>{{ plan.ctaText }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import type { PricingPlan } from '@/types/pricing-types';
  import PricingToggle from './PricingToggle.vue'; // Import the toggle component
  import { useGsap } from '@/composables/useGsap'; // Import useGsap
  import { useTransition } from '@vueuse/core';
  import { stripeService } from '@/services/stripe.service';
  import { useRouter } from 'vue-router';
  import { useToast } from '@/composables/useToast';
  import { useAuthStore } from '@/stores/auth';

  const isMonthly = ref(true); // Default to monthly view
  const savingsCircleRef = ref<HTMLElement | null>(null);
  const { gsap } = useGsap();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const authStore = useAuthStore();
  const isProcessing = ref(false);

  const pricingPlans = ref<PricingPlan[]>([
    {
      id: 'pro',
      name: 'The Plan',
      description: 'Unlock advanced features and unlimited comparisons.',
      priceMonthly: 900,
      priceYearly: 9000,
      priceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_MONTHLY,
      priceIdYearly: import.meta.env.VITE_STRIPE_PRICE_ANNUAL,
      features: [
        'Unlimited Rate Deck Comparisons',
        'US NPANXX and A-Z formats',
        'Advanced Code & Pricing Reports',
        'Updated LERG on a monthly basis',
        'US & A-Z Rate Sheet Wizards',
        'Export Refined Rate Sheets',
        'Local Browser Storage - no data leaks ever',
      ],
      ctaText: 'Get Started Now',
    },
  ]);

  // --- Price Animation ---
  const transitionConfig = { duration: 500 };
  const priceSource = computed(() => {
    const plan = pricingPlans.value[0]; // Assuming only one plan for now
    const price = isMonthly.value ? plan.priceMonthly : plan.priceYearly;
    return typeof price === 'number' ? price : 0; // Return 0 if price is not a number
  });
  const animatedPrice = useTransition(priceSource, transitionConfig);

  // Calculate Yearly Savings
  const yearlyFullPrice = computed(() => {
    const monthlyPrice = pricingPlans.value[0]?.priceMonthly;
    return typeof monthlyPrice === 'number' ? monthlyPrice * 12 : 0;
  });

  const yearlyDiscountedPrice = computed(() => {
    const yearlyPrice = pricingPlans.value[0]?.priceYearly;
    return typeof yearlyPrice === 'number' ? yearlyPrice : 0;
  });

  const yearlySavings = computed(() => {
    return yearlyFullPrice.value - yearlyDiscountedPrice.value;
  });

  // Computed function to display the correct price
  function displayPrice(plan: PricingPlan): string {
    const price = isMonthly.value ? plan.priceMonthly : plan.priceYearly;
    // Display animated price if it's a number, otherwise the original string
    return typeof price === 'number' ? `$${Math.round(animatedPrice.value)}` : String(price);
  }

  // Watch for changes in billing cycle to animate savings circle
  watch(isMonthly, (newVal, oldVal) => {
    if (savingsCircleRef.value && newVal !== oldVal) {
      if (!newVal) {
        // Switched to Yearly
        // Delay animation slightly to sync with price transition
        gsap.to(savingsCircleRef.value, { clearProps: 'all' }); // Reset previous state
        setTimeout(() => {
          if (savingsCircleRef.value) {
            // Check ref again inside timeout
            gsap.fromTo(
              savingsCircleRef.value,
              { scale: 0, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                duration: 0.6,
                ease: 'elastic.out(1, 0.6)',
                display: 'flex', // Ensure it becomes visible
              }
            );
          }
        }, 400); // Delay slightly less than price animation (500ms)
      } else {
        // Switched back to Monthly
        gsap.to(savingsCircleRef.value, {
          scale: 0,
          opacity: 0,
          duration: 0.2,
          ease: 'power2.in',
          display: 'none', // Hide it completely
        });
      }
    }
  });

  // Handle subscription button click
  async function handleSubscribe(plan: PricingPlan) {
    try {
      // Check if user is logged in
      if (!authStore.user) {
        showError('Please sign in to subscribe');
        router.push('/auth/signin?redirect=/pricing');
        return;
      }

      isProcessing.value = true;

      // Get the appropriate price ID based on billing cycle
      const priceId = isMonthly.value ? plan.priceIdMonthly : plan.priceIdYearly;
      
      
      if (!priceId) {
        throw new Error('Price ID not configured');
      }

      // Create checkout session
      await stripeService.createCheckoutSession({
        priceId,
      });

      // Stripe will handle the redirect
    } catch (error) {
      console.error('Subscription error:', error);
      showError(error instanceof Error ? error.message : 'Failed to start subscription');
    } finally {
      isProcessing.value = false;
    }
  }
</script>

<!-- No <style> block needed as we are using Tailwind -->
