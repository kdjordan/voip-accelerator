<script setup lang="ts">
  import { BoltIcon } from '@heroicons/vue/24/outline';
  import { RouterLink } from 'vue-router';
  import TopNav from '@/components/shared/TopNav.vue';
</script>

<template>
  <div class="min-h-screen bg-fbBlack text-white overflow-x-hidden">
    <!-- Top Navigation Bar -->
    
    <!-- Hero Section - Simplified to match reference design -->
    <section class="mt-24 border rounded-lg mx-4 py-24">
      <TopNav />
      <!-- Colorful gradient background -->
      <!-- <div class="absolute inset-0 bg-gradient-to-br from-accent/20 via-accent/10 to-fbBlack z-0 border border-fbBorder/20 m-8 rounded-lg"></div> -->

      <!-- Grid pattern overlay -->
      <div class="absolute inset-0 bg-grid-pattern opacity-10 z-0"></div>

      <!-- Content container -->
      <div class="container mx-auto px-8 relative z-10 max-w-5xl">
        <div class="space-y-8">
          <!-- Main headline - Large and prominent -->
          <h1 class="text-6xl md:text-7xl lg:text-5xl font-bold tracking-tight">
            Supercharge Your VoIP Business with
            <span class="text-accent block mt-2">Instant Rate Deck Insights</span>
          </h1>

          <!-- Subheading - Clean and focused -->
          <p class="text-xl md:text-2xl text-fbWhite/80 max-w-3xl">
            Effortlessly upload and compare rate decks, leverage LERG lookups, and keep everything safe in your browser.
            Simplify your data. Accelerate your decisions.
          </p>

          <!-- Call to action buttons -->
          <div class="flex flex-wrap gap-4 pt-4">
            <RouterLink
              to="/azview"
              class="bg-accent text-fbBlack font-medium px-8 py-3 rounded-md hover:bg-accent/90 transition-colors text-center"
            >
              Let's Go
            </RouterLink>

            <RouterLink
              to="/pricing"
              class="bg-transparent border border-fbWhite/20 text-fbWhite font-medium px-8 py-3 rounded-md hover:bg-fbWhite/10 transition-colors text-center"
            >
              See pricing
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section - Simplified and modernized -->
    <section class="py-24 relative z-10 bg-fbBlack">
      <div class="container mx-auto px-8">
        <h2 class="text-4xl font-bold mb-16 text-fbWhite max-w-3xl">
          Streamline your VoIP operations with powerful tools built for telecom professionals
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="p-6 rounded-xl bg-fbHover/40 border border-fbBorder/20 hover:border-accent/30 transition-all">
            <div class="w-12 h-12 mb-6 text-accent font-bold text-2xl">01</div>
            <h3 class="text-xl font-bold mb-3 text-fbWhite">Rate Analysis</h3>
            <p class="text-fbWhite/70">
              Compare buy and sell rates across different providers to identify opportunities for cost reduction and
              revenue growth.
            </p>
          </div>

          <div class="p-6 rounded-xl bg-fbHover/40 border border-fbBorder/20 hover:border-accent/30 transition-all">
            <div class="w-12 h-12 mb-6 text-accent font-bold text-2xl">02</div>
            <h3 class="text-xl font-bold mb-3 text-fbWhite">Global Coverage</h3>
            <p class="text-fbWhite/70">
              Support for both international (AZ) and domestic (US) rate sheets with specialized tools for each market
              segment.
            </p>
          </div>

          <div class="p-6 rounded-xl bg-fbHover/40 border border-fbBorder/20 hover:border-accent/30 transition-all">
            <div class="w-12 h-12 mb-6 text-accent font-bold text-2xl">03</div>
            <h3 class="text-xl font-bold mb-3 text-fbWhite">Code Comparison</h3>
            <p class="text-fbWhite/70">
              Identify code mismatches before they impact your bottom line. Gain insight into code coverage statistics
              and country coverage.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-fbHover/20 relative">
      <div class="container mx-auto px-8">
        <div class="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto">
          <div class="mb-8 md:mb-0">
            <h2 class="text-3xl font-bold mb-4 text-fbWhite">Ready to optimize your VOIP pricing?</h2>
            <p class="text-fbWhite/70 max-w-xl text-xl">Start saving time and finding opportunities today.</p>
          </div>
          <RouterLink
            to="/azview"
            class="bg-accent text-fbBlack font-medium px-8 py-3 rounded-md hover:bg-accent/90 transition-colors whitespace-nowrap"
          >
            Get Started — It's Free
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 border-t border-fbBorder/20">
      <div class="container mx-auto px-8">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="flex items-center text-accent mb-6 md:mb-0">
            <BoltIcon class="w-6 h-6" />
            <span class="text-xl font-medium ml-2">VOIP Accelerator</span>
          </div>
          <div class="flex flex-wrap gap-x-8 gap-y-4">
            <RouterLink
              to="/pricing"
              class="text-fbWhite/70 hover:text-accent transition-colors"
            >
              Pricing
            </RouterLink>
            <RouterLink
              to="/about"
              class="text-fbWhite/70 hover:text-accent transition-colors"
            >
              About
            </RouterLink>
            <RouterLink
              to="/terms"
              class="text-fbWhite/70 hover:text-accent transition-colors"
            >
              Terms
            </RouterLink>
            <RouterLink
              to="/privacy"
              class="text-fbWhite/70 hover:text-accent transition-colors"
            >
              Privacy
            </RouterLink>
          </div>
        </div>
        <div class="mt-12 text-center text-fbWhite/50 text-sm">
          &copy; {{ new Date().getFullYear() }} VOIP Accelerator. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
  .bg-grid-pattern {
    background-size: 50px 50px;
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  }
</style>
