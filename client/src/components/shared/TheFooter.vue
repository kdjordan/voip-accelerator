<template>
  <footer class="py-8 text-sm text-zinc-500">
    <div class="flex flex-col items-center justify-center">
      <div class="text-zinc-600">
        &copy; {{ new Date().getFullYear() }} VoIP Accelerator. All rights reserved.
      </div>
      <div class="mt-2">
        Built with <span class="text-rose-400">❤</span> by
        <a
          href="https://kevinjordan.dev"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors font-medium group"
        >
          Kevin Jordan
          <svg
            class="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </a>
      </div>
      <div class="mt-1">
        If you like this, you might like
        <a
          href="https://reconcilecdr.com"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors font-medium group"
        >
          ReconcileCDR
          <svg
            class="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </a>
      </div>
      <div class="flex items-center justify-center gap-4 mt-4 text-zinc-500">
        <RouterLink
          to="/terms-and-conditions"
          class="hover:text-zinc-200 transition-colors"
          target="_blank"
        >
          Terms
        </RouterLink>
        <span class="text-zinc-700">|</span>
        <RouterLink to="/privacy-policy" class="hover:text-zinc-200 transition-colors" target="_blank">
          Privacy
        </RouterLink>
        <span class="text-zinc-700">|</span>
        <a
          href="https://kevinjordan.dev"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-zinc-200 transition-colors flex items-center"
        >
          About
          <ArrowTopRightOnSquareIcon class="w-3 h-3 ml-1" />
        </a>
        <template v-if="isHomePage">
          <span class="text-zinc-700">|</span>
          <RouterLink to="#hero" class="hover:text-zinc-200 transition-colors"> Top </RouterLink>
        </template>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { RouterLink, useRoute } from 'vue-router';
  import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline';

  const route = useRoute();
  const isHomePage = computed(() => route.name === 'home');
</script>
