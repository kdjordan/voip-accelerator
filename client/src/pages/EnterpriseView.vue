<template>
  <div class="min-h-screen text-white pt-2 w-full">
    <h1 class="text-3xl text-accent uppercase rounded-lg px-4 py-2 font-secondary">Enterprise Dashboard</h1>

    <!-- Dashboard Content -->
    <div class="flex flex-col gap-6 mb-8">
      <!-- Feature Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700/50">
          <h2 class="text-xl font-semibold mb-2 text-white">Organization Overview</h2>
          <p class="text-gray-400">Manage your enterprise organization settings and team members.</p>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700/50">
          <h2 class="text-xl font-semibold mb-2 text-white">Usage Analytics</h2>
          <p class="text-gray-400">View detailed usage statistics and reports for your organization.</p>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700/50">
          <h2 class="text-xl font-semibold mb-2 text-white">Billing & Invoices</h2>
          <p class="text-gray-400">Access billing information and download invoices.</p>
        </div>
      </div>

      <!-- Team Members Section -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700/50">
        <h2 class="text-2xl font-semibold mb-4 text-white">Team Members</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <p class="text-gray-400">Manage team members who can access your enterprise account.</p>
            <button class="bg-accent text-black px-4 py-2 rounded-md hover:bg-accent/90 transition-colors font-medium">
              Invite Member
            </button>
          </div>
          
          <div class="border-t border-gray-700 pt-4">
            <p class="text-sm text-gray-500">Team member management coming soon...</p>
          </div>
        </div>
      </div>

      <!-- Enterprise Features Info -->
      <div class="bg-accent/10 border border-accent/30 rounded-lg p-4">
        <div class="flex items-start">
          <div class="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
            <svg class="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-accent">Enterprise Features</h3>
            <p class="text-sm text-accent/80 mt-1">
              As an enterprise customer, you have access to priority support, advanced analytics, 
              and team collaboration features. Contact support for any assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/user-store';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

onMounted(() => {
  // Verify the user has enterprise admin access
  if (!userStore.isEnterpriseAdmin && !userStore.isSuperAdmin) {
    router.push({ name: 'AccessDenied' });
  }
});
</script>

<style scoped>
/* Styles handled by Tailwind classes */
</style>