<script setup lang="ts">
  import { BoltIcon, GlobeAltIcon, ChartBarIcon, DocumentDuplicateIcon } from '@heroicons/vue/24/outline';
  import { RouterLink } from 'vue-router';
  import TopNav from '@/components/shared/TopNav.vue';
</script>

<template>
  <div class="min-h-screen bg-fbBlack text-white overflow-x-hidden">
    <!-- Top Navigation Bar -->
    <TopNav />

    <!-- Hero Section -->
    <section class="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div class="container mx-auto px-6 relative z-10">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Supercharge Your VoIP Business with
            <span class="text-accent block mt-2">Instant Rate Deck Insights</span>
          </h1>
          <p class="text-xl mb-10 text-fbLightMuted">
            Effortlessly upload and compare rate decks, leverage LERG lookups, and keep everything
            safe in your browser. Simplify your data. Accelerate your decisions.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <RouterLink
              to="/azview"
              class="bg-accent text-fbBlack font-semibold py-4 px-8 rounded-md hover:bg-accent/90 transition-colors text-center text-lg"
            >
              Let's Go
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Add a lot of content to ensure scrolling -->
    <div class="py-20">
      <div class="container mx-auto px-6">
        <div class="space-y-20">
          <!-- Features Section -->
          <section class="relative z-10">
            <h2 class="text-3xl font-bold text-center mb-4 text-fbWhite">Streamline Your VOIP Operations</h2>
            <p class="text-center text-fbLightMuted max-w-2xl mx-auto mb-16">
              Our toolset helps you optimize rates, compare codes, and make data-driven decisions for your
              telecommunications business. Create your business case in minutes.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div class="bg-fbHover p-6 rounded-lg border border-fbBorder/50 hover:border-accent/50 transition-all">
                <div class="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                  <ChartBarIcon class="w-6 h-6 text-accent" />
                </div>
                <h3 class="text-xl font-bold mb-3 text-fbWhite">Pricing Tool</h3>
                <p class="text-fbLightMuted">
                  Find buy and sell opportunities by comparing your rates with your prospects. No more guesswork. No more Excel.
                </p>
              </div>

              <div class="bg-fbHover p-6 rounded-lg border border-fbBorder/50 hover:border-accent/50 transition-all">
                <div class="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                  <GlobeAltIcon class="w-6 h-6 text-accent" />
                </div>
                <h3 class="text-xl font-bold mb-3 text-fbWhite">Global Coverage</h3>
                <p class="text-fbLightMuted">
                  Support for both international (AZ) and domestic (US) rate sheets with specialized tools for each
                  market segment.
                </p>
              </div>

              <div class="bg-fbHover p-6 rounded-lg border border-fbBorder/50 hover:border-accent/50 transition-all">
                <div class="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                  <DocumentDuplicateIcon class="w-6 h-6 text-accent" />
                </div>
                <h3 class="text-xl font-bold mb-3 text-fbWhite">Code Comparison</h3>
                <p class="text-fbLightMuted">
                  Identify code mismathces before they impact your bottom line. Gain insight into code coverage statistics and country coverage.
                </p>
              </div>
            </div>
          </section>

          <!-- CTA Section -->
          <section class="py-16 bg-fbHover relative overflow-hidden rounded-xl">
            <div class="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent"></div>
            <div class="container mx-auto px-6 relative z-10">
              <div class="flex flex-col md:flex-row items-center justify-between">
                <div class="mb-8 md:mb-0">
                  <h2 class="text-3xl font-bold mb-3 text-fbWhite">Ready to optimize your VOIP pricing decisions?</h2>
                  <p class="text-fbLightMuted max-w-xl">
                    Start saving time and finding opportunities today.
                  </p>
                </div>
                <RouterLink
                  to="/azview"
                  class="bg-accent text-fbBlack font-semibold py-3 px-8 rounded-md hover:bg-accent/90 transition-colors"
                >
                  Get Started — It's Free
                </RouterLink>
              </div>
            </div>
          </section>

          <!-- Additional content to ensure scrolling -->
          <section>
            <h2 class="text-3xl font-bold text-center mb-8 text-fbWhite">Why Choose VOIP Accelerator?</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 class="text-xl font-bold mb-4 text-accent">Powerful Analytics</h3>
                <p class="text-fbLightMuted mb-4">
                  Our platform provides deep insights into your rate data, helping you make informed decisions about
                  pricing and routing strategies.
                </p>
                <ul class="space-y-2 text-fbLightMuted">
                  <li class="flex items-start">
                    <span class="text-accent mr-2">✓</span>
                    <span>Real-time rate comparison across providers</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-accent mr-2">✓</span>
                    <span>Historical trend analysis for rate changes</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-accent mr-2">✓</span>
                    <span>Automated anomaly detection for pricing errors</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 class="text-xl font-bold mb-4 text-accent">Seamless Integration</h3>
                <p class="text-fbLightMuted mb-4">
                  VOIP Accelerator works with your existing systems and processes, making implementation quick and
                  hassle-free.
                </p>
                <ul class="space-y-2 text-fbLightMuted">
                  <li class="flex items-start">
                    <span class="text-accent mr-2">✓</span>
                    <span>Import data from any CSV or Excel format</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-accent mr-2">✓</span>
                    <span>Export reports in multiple formats</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-accent mr-2">✓</span>
                    <span>API access for automated workflows</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="py-12 border-t border-fbBorder/30">
      <div class="container mx-auto px-6">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="flex items-center text-accent mb-4 md:mb-0">
            <BoltIcon class="w-6 h-6" />
            <span class="text-xl font-bold ml-2">VOIP Accelerator</span>
          </div>
          <div class="flex space-x-6">
            <RouterLink
              to="/azview"
              class="text-fbLightMuted hover:text-accent transition-colors"
            >
              Pricing
            </RouterLink>
            <RouterLink
              to="/azview"
              class="text-fbLightMuted hover:text-accent transition-colors"
            >
              About
            </RouterLink>
            <RouterLink
              to="/azview"
              class="text-fbLightMuted hover:text-accent transition-colors"
            >
              Terms
            </RouterLink>
            <RouterLink
              to="/azview"
              class="text-fbLightMuted hover:text-accent transition-colors"
            >
              Privacy
            </RouterLink>
          </div>
        </div>
        <div class="mt-8 text-center text-fbLightMuted text-sm">
          &copy; {{ new Date().getFullYear() }} VOIP Accelerator. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>
