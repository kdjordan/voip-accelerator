<template>
  <footer class="text-muted-foreground py-3 text-sizeSm text-foreground">
    <div class="flex flex-col items-center justify-center">
      <div class="mt-12 text-fbWhite/50 text-sm">
        &copy; {{ new Date().getFullYear() }} VOIP Accelerator. All rights reserved.
      </div>
      <div class="mt-2 text-fbWhite/50 text-sm">
        Built with <span class="text-red-500">❤️</span> by
        <a
          href="https://kevinjordan.dev"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-accent hover:text-accent/80 transition-colors font-medium group"
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
      <div class="flex items-center justify-start space-x-4 mt-4 text-fbWhite/50">
        <RouterLink
          to="/terms-and-conditions"
          class="hover:text-fbWhite/90 transition-colors"
          target="_blank"
        >
          Terms
        </RouterLink>
        <span class="text-fbWhite/50">|</span>
        <RouterLink
          to="/privacy-policy"
          class="hover:text-fbWhite/90 transition-colors"
          target="_blank"
        >
          Privacy
        </RouterLink>
        <span class="text-fbWhite/50">|</span>
        <a
          href="https://kevinjordan.dev"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-fbWhite/90 transition-colors flex items-center"
        >
          About
          <ArrowTopRightOnSquareIcon class="w-3 h-3 ml-1" />
        </a>
        <template v-if="isHomePage">
          <span class="text-fbWhite/50">|</span>
          <RouterLink to="#hero" class="hover:text-fbWhite/90 transition-colors"> Top </RouterLink>
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
