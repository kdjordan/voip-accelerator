<template>
  <footer class="py-8 text-sm text-zinc-500">
    <div class="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Info card: secure / built-with / learn-more -->
      <div class="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-5">
        <div
          class="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-0 md:divide-x md:divide-white/10"
        >
          <!-- Your data is secure -->
          <div class="flex items-start gap-3 md:pr-6">
            <ShieldCheckIcon class="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <p class="font-medium text-zinc-200">Your data is secure</p>
              <p class="mt-1 text-xs leading-relaxed text-zinc-500">
                Files are processed securely and are not stored after analysis.
              </p>
            </div>
          </div>

          <!-- Built with love -->
          <div class="flex items-start gap-3 md:px-6">
            <HeartIcon class="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <p class="font-medium text-zinc-200">
                Built with <span class="text-rose-400">❤</span> by
                <a
                  href="https://kevinjordan.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Kevin Jordan
                </a>
              </p>
              <p class="mt-1 text-xs leading-relaxed text-zinc-500">
                VoIP industry tools made for analysts, by an analyst.
              </p>
            </div>
          </div>

          <!-- Learn more -->
          <div class="flex items-start gap-3 md:pl-6">
            <DocumentTextIcon class="w-5 h-5 shrink-0 mt-0.5 text-zinc-400" />
            <div>
              <p class="font-medium text-zinc-200">Learn more</p>
              <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                <RouterLink
                  to="/terms-and-conditions"
                  target="_blank"
                  class="hover:text-zinc-200 transition-colors"
                >
                  Terms of Service
                </RouterLink>
                <span class="text-zinc-700">|</span>
                <RouterLink
                  to="/privacy-policy"
                  target="_blank"
                  class="hover:text-zinc-200 transition-colors"
                >
                  Privacy Policy
                </RouterLink>
                <span class="text-zinc-700">|</span>
                <a
                  href="https://kevinjordan.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center hover:text-zinc-200 transition-colors"
                >
                  About
                  <ArrowTopRightOnSquareIcon class="w-3 h-3 ml-1" />
                </a>
                <template v-if="isHomePage">
                  <span class="text-zinc-700">|</span>
                  <RouterLink to="#hero" class="hover:text-zinc-200 transition-colors">
                    Top
                  </RouterLink>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Copyright + cross-promo card -->
      <div
        class="mt-3 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3 flex flex-col gap-2 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="text-zinc-600">
          &copy; {{ new Date().getFullYear() }} VoIP Accelerator. All rights reserved.
        </div>
        <div>
          If you like this, you might like
          <a
            href="https://reconcilecdr.com"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors font-medium group"
          >
            ReconcileCDR
            <ArrowTopRightOnSquareIcon
              class="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity"
            />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { RouterLink, useRoute } from 'vue-router';
  import {
    ArrowTopRightOnSquareIcon,
    ShieldCheckIcon,
    HeartIcon,
    DocumentTextIcon,
  } from '@heroicons/vue/24/outline';

  const route = useRoute();
  const isHomePage = computed(() => route.name === 'home');
</script>
