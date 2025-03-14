<script setup lang="ts">
  import { RouterLink } from 'vue-router';
  import TopNav from '@/components/shared/TopNav.vue';
  import TheFooter from '@/components/shared/TheFooter.vue';
  import FeatureCards from '@/components/home/FeatureCards.vue';
</script>

<template>
  <div class="min-h-screen bg-fbBlack text-white overflow-x-hidden">
    <!-- Top Navigation Bar -->

    <!-- Hero Section - Simplified to match reference design -->
    <section class="mt-4 rounded-3xl mx-4 pb-32 pt-16 bg-gradient-to-br from-accent/80 via-accent/30 to-fbBlack">
      <TopNav />
      <!-- Colorful gradient background -->
      <!-- <div class="absolute inset-0 bg-gradient-to-br from-accent/20 via-accent/10 to-fbBlack z-0 border border-fbBorder/20 m-8 rounded-lg"></div> -->

      <!-- Grid pattern overlay -->
      <!-- <div class="absolute inset-0 bg-grid-pattern opacity-10 z-0"></div> -->

      <!-- Content container -->
      <div class="container relative z-10 max-w-7xl mx-auto">
        <div class="space-y-8">
          <!-- Main headline - Large and prominent -->
          <h1 class="text-6xl md:text-7xl lg:text-size4xl font-medium tracking-tighter">
            Instant Rate Deck Insights
            <!-- <span class="text-accent block mt-2">Instant Rate Deck Insights</span> -->
          </h1>
          <!-- Subheading - Clean and focused -->
          <p class="text-base md:text-2xl text-fbWhite/80 max-w-2xl">
            Compare your rates against theirs, leverage LERG lookups, keep everything safe in your browser, and export
            your reports.
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
      <div class="flex flex-row gap-4">
        <div class="w-1/3 bg-accent/70 rounded-3xl p-8">
          <div class="text-size4xl max-w-4xl text-center mx-auto text-fbBlack leading-none">
            <span class="font-secondary block font-bold">CRUSH</span>
            <span class="font-secondary block font-bold">YOUR</span>
            <span class="font-secondary block font-bold">BUSINESS</span>
            <span class="font-secondary block font-bold">CASES</span>
          </div>
        </div>
        <div class="w-2/3 bg-fbWhite rounded-3xl p-8">
          <p class="text-4xl max-w-4xl text-right mx-auto text-fbBlack leading-normal uppercase">
            No more wasted time staring at Excel only to learn nothing actionable. Upload your decks, get pricing and
            code insights, and find your opportunities - all before your coffee cools.
          </p>
        </div>
      </div>
    </section>

    <!-- Features Section with Infinite Scroll -->
    <section class="pt-8 pb-8 relative z-10 bg-fbBlack">
      <div class="container mx-auto mb-2 font-secondary w-full">
        <h2 class="text-size3xl text-center mx-auto mb-4 text-accent uppercase font-">Why You'll Love VOIP Accelerator</h2>
        <h3 class="text-3xl text-fbWhite max-w-3xl text-center mx-auto mb-2">Efficiency. Accuracy. Insight.</h3>
        <h3 class="text-3xl mb-12 text-fbWhite max-w-3xl text-center mx-auto">All Without Excel...</h3>
      </div>

      <!-- Import the Feature Cards component -->
      <FeatureCards />
    </section>

    <!-- CTA Section -->
    <section class="p-[5px] bg-gradient-to-br from-accent/80 via-accent/30 to-fbBlack">
      <div class="border border-accent/20 pt-24 pb-8 bg-fbBlack rounded-3xl">
        <div class="container mx-auto px-4">
          <div class="flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
            <div class="mb-12">
              <p class="text-fbWhite text-sm mx-auto mb-12 tracking-wider font-secondary">GET STARTED</p>
              <h2 class="text-3xl mb-8 text-white">Ready to optimize your VOIP pricing?</h2>
              <p class="text-fbWhite text-xl mx-auto w-2/3 font-secondary">
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
      </div>
    </section>

    <!-- Footer -->
  </div>
</template>

<style scoped>
  .bg-grid-pattern {
    background-size: 50px 50px;
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  }
</style>
