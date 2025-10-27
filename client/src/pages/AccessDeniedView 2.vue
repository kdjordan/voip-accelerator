<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center px-4">
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <svg class="mx-auto h-24 w-24 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h1 class="text-3xl font-bold text-white mb-4">Access Denied</h1>
      <p class="text-gray-400 mb-8 leading-relaxed">
        You don't have permission to access this page. Admin privileges are required.
      </p>
      
      <div class="space-y-4">
        <BaseButton 
          @click="goToDashboard" 
          variant="primary" 
          class="w-full"
        >
          Go to Dashboard
        </BaseButton>
        
        <BaseButton 
          @click="goBack" 
          variant="secondary" 
          class="w-full"
        >
          Go Back
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import BaseButton from '@/components/shared/BaseButton.vue';

const router = useRouter();

function goToDashboard() {
  router.push({ name: 'dashboard' });
}

function goBack() {
  router.back();
}
</script>