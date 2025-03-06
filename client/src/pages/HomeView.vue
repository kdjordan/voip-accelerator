<script setup lang="ts">
  import { ChartBarIcon, GlobeAltIcon, DocumentDuplicateIcon } from '@heroicons/vue/24/outline';
  import { RouterLink } from 'vue-router';
  import TopNav from '@/components/shared/TopNav.vue';
  import TheFooter from '@/components/shared/TheFooter.vue';
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
              to="/azview"
              class="bg-accent text-fbBlack font-medium px-8 py-3 rounded-3xl hover:bg-accent/90 transition-colors text-center"
            >
              Let's Go
            </RouterLink>

            <RouterLink
              to="/pricing"
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
      <div class="flex flex-row gap-16">
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
            No more wasted time staring at Excel only to learn nothing actionable. Upload your decks, get pricing and code insights, and find your opportunities - all before your coffee cools.
          </p>
        </div>
      </div>
    </section>
    <!-- Features Section - Simplified and modernized -->
    <section class="pt-24 pb-48 relative z-10 bg-fbBlack">
      <div class="container mx-auto px-8 tracking-wide">
        <h2 class="text-4xl max-w-4xl text-center mx-auto mb-4 text-accent">
          Build VOIP Business Cases with Confidence.
        </h2>
        <h3 class="text-3xl text-fbWhite max-w-3xl text-center mx-auto mb-2">Save Time. Find Margin.</h3>
        <h3 class="text-3xl mb-24 text-fbWhite max-w-3xl text-center mx-auto">All Without Excel...</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            class="p-6 rounded-xl bg-fbBlack border border-accent/20 hover:border-accent/30 transition-all relative overflow-hidden"
          >
            <!-- Spotlight effect for first card -->
            <div class="absolute -top-10 -right-20 w-40 h-40 bg-accent/40 rounded-full blur-2xl opacity-70"></div>
            <div class="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-6 relative z-10">
              <ChartBarIcon class="w-6 h-6 text-accent" />
            </div>
            <h3 class="text-xl mb-3 text-white relative z-10">Rate Analysis</h3>
            <p class="text-fbWhite relative z-10">
              Compare buy and sell rates across different providers to identify opportunities for cost reduction and
              revenue growth.
            </p>
          </div>

          <div
            class="p-6 rounded-xl bg-fbBlack border border-accent/20 hover:border-accent/30 transition-all relative overflow-hidden"
          >
            <!-- Spotlight effect for second card - slightly different position -->
            <div class="absolute -top-5 -right-24 w-40 h-40 bg-accent/40 rounded-full blur-2xl opacity-70"></div>
            <div class="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-6 relative z-10">
              <GlobeAltIcon class="w-6 h-6 text-accent" />
            </div>
            <h3 class="text-xl mb-3 text-white relative z-10">Global Coverage</h3>
            <p class="text-fbWhite relative z-10">
              Support for both international (AZ) and domestic (US) rate sheets with specialized tools for each market
              segment.
            </p>
          </div>

          <div
            class="p-6 rounded-xl bg-fbBlack border border-accent/20 hover:border-accent/30 transition-all relative overflow-hidden"
          >
            <!-- Spotlight effect for third card - slightly different position again -->
            <div class="absolute -top-12 -right-1 w-40 h-40 bg-accent/40 rounded-full blur-2xl opacity-70"></div>
            <div class="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-6 relative z-10">
              <DocumentDuplicateIcon class="w-6 h-6 text-accent" />
            </div>
            <h3 class="text-xl mb-3 text-white relative z-10">Code Comparison</h3>
            <p class="text-fbWhite relative z-10">
              Identify code mismatches before they impact your bottom line. Gain insight into code coverage statistics
              and country coverage.
            </p>
          </div>
        </div>
      </div>
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
              to="/azview"
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
