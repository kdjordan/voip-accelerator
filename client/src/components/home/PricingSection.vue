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
        <div class="text-center mb-12 md:mb-16">
          <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Simple, Transparent Pricing
          </h2>
        </div>

        <!-- Pricing card with bento box styling -->
        <div class="flex justify-center">
          <div
            v-for="plan in pricingPlans"
            :key="plan.id"
            class="flex flex-col rounded-3xl border border-accent/30 bg-fbBlack w-full max-w-md transition-all duration-300 hover:border-accent/50"
          >
            <!-- Card content with enhanced styling -->
            <div class="p-8 md:p-10 flex-grow">
              <!-- Price highlight section -->
              <div class="mb-8 flex items-center justify-between">
                <h3 class="text-2xl md:text-3xl font-semibold text-white">{{ plan.name }}</h3>
                <div class="bg-accent/20 rounded-full px-4 py-1 text-sm text-accent font-medium">
                  Most Popular
                </div>
              </div>
              <p class="mt-2 text-fbWhite/70 text-sm md:text-base">{{ plan.description }}</p>

              <div class="mt-6 mb-8 flex items-baseline">
                <span class="text-5xl md:text-6xl font-bold text-accent">
                  {{
                    typeof plan.priceMonthly === 'number'
                      ? `$${plan.priceMonthly}`
                      : plan.priceMonthly
                  }}
                </span>
                <span class="text-base font-medium text-fbWhite/60 ml-1">/month</span>
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
              <a
                href="#"
                class="block w-full rounded-3xl px-6 py-4 text-center text-base md:text-lg font-semibold transition-all duration-300 bg-accent text-fbBlack hover:bg-accent/90"
              >
                {{ plan.ctaText }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import type { PricingPlan } from '@/types/pricing-types';

  const pricingPlans = ref<PricingPlan[]>([
    {
      id: 'pro',
      name: 'Pro Plan',
      description: 'Unlock advanced features and unlimited comparisons.',
      priceMonthly: 25,
      features: [
        'Unlimited Rate Deck Comparisons',
        'US NPANXX and A-Z formats',
        'Advanced Code & Pricing Reports (LERG, Margin Analysis)',
        'US & A-Z Rate Sheet Wizards',
        'Export Updated Rate Sheets (.xlsx, .csv)',
        'Priority Support',
        'Local Browser Storage',
      ],
      ctaText: 'Get Started Now',
    },
  ]);
</script>

<!-- No <style> block needed as we are using Tailwind -->
