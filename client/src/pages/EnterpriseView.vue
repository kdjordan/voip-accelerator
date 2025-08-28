<template>
  <div class="enterprise-dashboard">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Enterprise Dashboard</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-2">Organization Overview</h2>
          <p class="text-gray-600">Manage your enterprise organization settings and team members.</p>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-2">Usage Analytics</h2>
          <p class="text-gray-600">View detailed usage statistics and reports for your organization.</p>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-2">Billing & Invoices</h2>
          <p class="text-gray-600">Access billing information and download invoices.</p>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4">Team Members</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <p class="text-gray-600">Manage team members who can access your enterprise account.</p>
            <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Invite Member
            </button>
          </div>
          
          <div class="border-t pt-4">
            <p class="text-sm text-gray-500">Team member management coming soon...</p>
          </div>
        </div>
      </div>

      <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-blue-600 mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <div>
            <h3 class="text-sm font-semibold text-blue-900">Enterprise Features</h3>
            <p class="text-sm text-blue-800 mt-1">
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
.enterprise-dashboard {
  min-height: calc(100vh - 64px);
  background-color: #f7fafc;
}
</style>