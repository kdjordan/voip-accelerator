<template>
  <footer class="w-full border-t-2 border-line-strong text-sm text-fg-faint">
    <div class="px-6 md:px-10">
      <!-- Info band: secure / built-with / learn-more (full-width, rule-divided) -->
      <div class="grid grid-cols-1 border-b border-line md:grid-cols-3">
        <!-- Your data is secure -->
        <div class="flex items-start gap-3 py-7 md:pr-8">
          <ShieldCheckIcon class="w-5 h-5 shrink-0 mt-0.5 text-fg-faint" />
          <div>
            <div class="mb-1.5 font-display text-[10px] uppercase tracking-[0.16em] text-accent">
              Local &amp; secure
            </div>
            <p class="font-display text-sm font-semibold text-fg">Your data is secure</p>
            <p class="mt-1 font-sans text-xs leading-relaxed text-fg-faint">
              Files are processed securely and are not stored after analysis.
            </p>
          </div>
        </div>

        <!-- Built with love -->
        <div class="flex items-start gap-3 py-7 border-t border-line md:border-t-0 md:border-l md:px-8">
          <HeartIcon class="w-5 h-5 shrink-0 mt-0.5 text-accent" />
          <div>
            <div class="mb-1.5 font-display text-[10px] uppercase tracking-[0.16em] text-accent">
              Colophon
            </div>
            <p class="font-display text-sm font-semibold text-fg">
              Built with <span class="text-accent">❤</span> by
              <a
                href="https://kevinjordan.dev"
                target="_blank"
                rel="noopener noreferrer"
                class="text-accent hover:text-accent-text transition-colors"
              >
                Kevin Jordan
              </a>
            </p>
            <p class="mt-1 font-sans text-xs leading-relaxed text-fg-faint">
              VoIP industry tools made for analysts, by an analyst.
            </p>
          </div>
        </div>

        <!-- Learn more -->
        <div class="flex items-start gap-3 py-7 border-t border-line md:border-t-0 md:border-l md:pl-8">
          <DocumentTextIcon class="w-5 h-5 shrink-0 mt-0.5 text-fg-faint" />
          <div>
            <div class="mb-1.5 font-display text-[10px] uppercase tracking-[0.16em] text-accent">
              Reference
            </div>
            <p class="font-display text-sm font-semibold text-fg">Learn more</p>
            <div
              class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-[11px] uppercase tracking-wider text-fg-faint"
            >
              <RouterLink
                to="/terms-and-conditions"
                target="_blank"
                class="hover:text-fg transition-colors"
              >
                Terms of Service
              </RouterLink>
              <span class="text-fg-mute">·</span>
              <RouterLink
                to="/privacy-policy"
                target="_blank"
                class="hover:text-fg transition-colors"
              >
                Privacy Policy
              </RouterLink>
              <span class="text-fg-mute">·</span>
              <a
                href="https://kevinjordan.dev"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center hover:text-fg transition-colors"
              >
                About
                <ArrowTopRightOnSquareIcon class="w-3 h-3 ml-1" />
              </a>
              <template v-if="isHomePage">
                <span class="text-fg-mute">·</span>
                <RouterLink to="#hero" class="hover:text-fg transition-colors">Top</RouterLink>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom bar: copyright + cross-promo -->
      <div
        class="flex flex-col gap-2 py-4 font-display text-[11px] uppercase tracking-wider text-fg-mute sm:flex-row sm:items-center sm:justify-between"
      >
        <div>&copy; {{ new Date().getFullYear() }} VoIP Accelerator. All rights reserved.</div>
        <div class="text-fg-faint">
          If you like this, you might like
          <a
            href="https://reconcilecdr.com"
            target="_blank"
            rel="noopener noreferrer"
            class="group inline-flex items-center gap-1 text-accent hover:text-accent-text transition-colors"
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
