<script setup lang="ts">
  import { BoltIcon, GlobeAltIcon, ChartBarIcon, DocumentDuplicateIcon } from '@heroicons/vue/24/outline';
  import { RouterLink } from 'vue-router';
  import TopNav from '@/components/shared/TopNav.vue';
</script>

<template>
  <div class="min-h-screen bg-fbBlack text-fbWhite overflow-x-hidden">
    <!-- Top Navigation Bar -->
    <TopNav />

    <!-- Hero Section -->
    <section class="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-fbBlack via-fbBlack/95 to-accent/20 z-0"></div>
      <!-- Abstract Background Elements -->
      <div class="absolute inset-0 overflow-hidden z-0">
        <div class="absolute -top-[30%] -right-[10%] w-[50%] h-[80%] bg-accent/5 blur-[100px] rounded-full"></div>
        <div class="absolute top-[60%] -left-[20%] w-[60%] h-[60%] bg-accent/10 blur-[120px] rounded-full"></div>
      </div>

      <div class="container mx-auto px-6 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div class="text-left">
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              VOIP Accelerator: <span class="text-accent">Optimize Your Communication Infrastructure</span>
            </h1>
            <p class="text-xl mb-8 text-fbLightMuted max-w-xl">
              Streamline your communication strategy with powerful rate analysis, code comparison, and pricing
              optimization tools built for modern telecom professionals.
            </p>
            <div class="flex flex-col sm:flex-row gap-4">
              <RouterLink
                to="/azview"
                class="bg-accent text-fbBlack font-semibold py-3 px-8 rounded-md hover:bg-accent/90 transition-colors text-center"
              >
                Start Accelerating
              </RouterLink>
              <RouterLink
                to="/azview"
                class="text-fbWhite py-3 px-8 rounded-md border border-fbBorder hover:bg-fbHover transition-colors text-center"
              >
                Explore Features
              </RouterLink>
            </div>
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
              Our comprehensive toolset helps you optimize rates, compare codes, and make data-driven decisions for your
              telecommunications business.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div class="bg-fbHover p-6 rounded-lg border border-fbBorder/50 hover:border-accent/50 transition-all">
                <div class="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                  <ChartBarIcon class="w-6 h-6 text-accent" />
                </div>
                <h3 class="text-xl font-bold mb-3 text-fbWhite">Rate Analysis</h3>
                <p class="text-fbLightMuted">
                  Compare buy and sell rates across different providers to identify opportunities for cost reduction and
                  revenue growth.
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
                  Easily identify matching and non-matching codes across rate sheets to ensure complete coverage and
                  eliminate gaps.
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
                  <h2 class="text-3xl font-bold mb-3 text-fbWhite">Ready to optimize your VOIP operations?</h2>
                  <p class="text-fbLightMuted max-w-xl">
                    Join telecom professionals worldwide who trust VOIP Accelerator to streamline their rate management
                    and code analysis.
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
