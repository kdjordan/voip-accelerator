<template>
  <footer class="text-muted-foreground py-3 text-sizeSm text-foreground">
    <div class="flex flex-col items-center justify-center">
      <div class="mt-12 text-fbWhite/50 text-sm">
        &copy; {{ new Date().getFullYear() }} VOIP Accelerator. All rights reserved.
      </div>
      <div class="flex items-center justify-start space-x-4 mt-4 text-fbWhite/50">
        <RouterLink to="#pricing" class="hover:text-fbWhite/90 transition-colors">
          Pricing
        </RouterLink>
        <span class="text-fbWhite/50">|</span>
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
          FlatBrim
          <ArrowTopRightOnSquareIcon class="w-3 h-3 ml-1" />
        </a>
        <span class="text-fbWhite/50">|</span>
         <RouterLink
          to="#hero"
          class="hover:text-fbWhite/90 transition-colors"
        >
          Top
        </RouterLink>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router';
  import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline';
</script>
