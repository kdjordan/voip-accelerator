<template>
  <footer class="text-muted-foreground py-3 text-sizeSm text-foreground">
    <div class="flex items-center justify-center">
      <div class="flex items-center justify-start space-x-4">
        <RouterLink to="#" class="hover:text-foreground/50 transition-colors">
          Pricing
        </RouterLink>
        <span class="text-foreground/50">|</span>
        <RouterLink to="#" class="hover:text-foreground/50 transition-colors">
          Enterprise
        </RouterLink>
        <span class="text-foreground/50">|</span>
        <RouterLink to="#" class="hover:text-foreground/50 transition-colors">
          FAQ
        </RouterLink>
        <span class="text-foreground/50">|</span>
        <RouterLink to="#" class="hover:text-foreground/50 transition-colors">
          Legal
        </RouterLink>
        <span class="text-foreground/50">|</span>
        <RouterLink to="#" class="hover:text-foreground/50 transition-colors">
          Privacy
        </RouterLink>
        <span class="text-foreground/50">|</span>
        <a 
          href="#" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="hover:text-foreground/50 transition-colors flex items-center"
        >
          FlatBrim
          <ArrowTopRightOnSquareIcon class="w-3 h-3 ml-1" />
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();
</script>