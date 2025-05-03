<script setup lang="ts">
  import { RouterLink } from 'vue-router';
  import TopNav from '@/components/shared/TopNav.vue';
  import MarketingMobileNav from '@/components/shared/MarketingMobileNav.vue';
  import TheFooter from '@/components/shared/TheFooter.vue';
  import FeatureCards from '@/components/home/FeatureCards.vue';
  import PricingSection from '@/components/home/PricingSection.vue';
  import { marketingNavigationItems } from '@/constants/navigation';
</script>

<template>
  <div class="min-h-screen bg-fbBlack text-white overflow-x-hidden">
    <!-- Hero Section -->
    <!-- Mobile Nav and Desktop Nav are now both placed inside the section -->
    <!-- Added pt-0 to section as inner components now handle padding -->
    <section
      class="mt-4 rounded-3xl mx-4 pb-32 pt-0 bg-gradient-to-br from-accent/80 via-accent/30 to-fbBlack relative overflow-hidden"
    >
      <!-- Mobile Navigation (shows on mobile, positioned inside) -->
      <MarketingMobileNav :items="marketingNavigationItems" class="md:hidden" />

      <!-- Desktop Navigation (shows on desktop, positioned inside) -->
      <TopNav class="hidden md:flex" />

      <!-- Content container -->
      <!-- Adjusted padding/margin if needed based on nav component changes -->
      <div class="container relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div class="space-y-8">
          <!-- Main headline - Large and prominent -->
          <h1 class="text-6xl md:text-7xl lg:text-7xl font-medium tracking-tighter">
            Instant Rate Deck Insights
          </h1>
          <!-- Subheading - Clean and focused -->
          <p class="text-base md:text-2xl text-fbWhite/80 max-w-2xl">
            Compare your rates against theirs, leverage LERG lookups, keep everything safe in your
            browser, and export your reports.
            <span class="text-white block mt-4 font-secondary text-xl">Simplify your data.</span>
            <span class="text-white block font-secondary text-xl">Accelerate your decisions.</span>
          </p>

          <!-- Call to action buttons -->
          <div class="flex flex-wrap gap-4 pt-4">
            <RouterLink
              to="/dashboard"
              class="bg-accent text-fbBlack font-medium px-8 py-3 rounded-3xl hover:bg-accent/90 transition-colors text-center"
            >
              Let's Go
            </RouterLink>

            <RouterLink
              to="/dashboard"
              class="bg-transparent border border-fbWhite/20 text-fbWhite font-medium px-8 py-3 rounded-3xl hover:bg-fbWhite/10 transition-colors text-center"
            >
              See pricing
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
    <!--Pain Points Section-->
    <section class="pt-4 px-4 pb-32 w-full z-10 bg-fbBlack">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="w-full md:w-1/3 bg-accent/70 rounded-3xl p-8 flex items-center justify-center">
          <div class="text-4xl md:text-5xl lg:text-6xl text-center text-fbBlack leading-none">
            <span class="font-secondary block font-bold">CRUSH</span>
            <span class="font-secondary block font-bold">YOUR</span>
            <span class="font-secondary block font-bold">BUSINESS</span>
            <span class="font-secondary block font-bold">CASES</span>
          </div>
        </div>
        <div class="w-full md:w-2/3 bg-fbWhite rounded-3xl p-8">
          <p
            class="text-4xl max-w-4xl text-center md:text-right mx-auto text-fbBlack leading-normal uppercase"
          >
            No more wasted time staring at Excel only to learn nothing actionable. Upload your
            decks, get pricing and code insights, and find your opportunities - all before your
            coffee cools.
          </p>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="pt-8 pb-8 relative z-10 bg-fbBlack">
      <div class="container mx-auto mb-2 font-secondary w-full">
        <h2 class="text-3xl md:text-5xl text-center mx-auto mb-4 text-accent uppercase font-">
          Why You'll Love VOIP Accelerator
        </h2>
        <h3 class="text-xl md:text-3xl text-fbWhite max-w-3xl text-center mx-auto mb-2">
          Efficiency. Accuracy. Insight.
        </h3>
        <h3 class="text-xl md:text-3xl mb-12 text-fbWhite max-w-3xl text-center mx-auto">
          All Without Excel...
        </h3>
      </div>
      <FeatureCards />
    </section>
    <section id="pricing">
      <PricingSection />
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-24 bg-fbBlack">
      <div class="container mx-auto px-4">
        <div class="flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
          <div class="mb-12">
            <p class="text-accent text-sm mx-auto mb-12 tracking-wider font-secondary">
              GET STARTED
            </p>
            <h2 class="text-3xl mb-8 text-gray-300">Ready to optimize your VOIP operations?</h2>
            <p class="text-xl mx-auto w-2/3 font-secondary text-accent">
              Get the cheat code for buying and selling in the VOIP market.
            </p>
          </div>
          <RouterLink
            to="/dashboard"
            class="bg-accent text-fbBlack font-medium px-8 py-3 rounded-3xl hover:bg-accent/90 transition-colors whitespace-nowrap"
          >
            Get Started — It's Free
          </RouterLink>
        </div>
      </div>
      <div class="pt-12">
        <TheFooter />
      </div>
    </section>
  </div>
</template>
