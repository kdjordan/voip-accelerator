<template>
  <div class="flex">
    <div
      :class="['w-64 bg-gray-800 text-white h-screen transition-transform fixed top-16 left-0', { 'transform -translate-x-full': !isOpen }]"
    >
      <div class="p-4 flex items-center justify-between pt-10">
        <h2 class="text-lg font-semibold">Sidebar</h2>
        <button @click="toggleSidebar" class="focus:outline-none">
          <span v-if="isOpen">←</span>
          <span v-else>→</span>
        </button>
      </div>
      <ul>
        <li v-for="item in items" :key="item.name" class="p-4 hover:bg-gray-700">
          <router-link 
            :to="item.to" 
            class="flex items-center space-x-2"
          >
            <i :class="item.icon"></i> 
            <span>{{ item.name }}</span>
          </router-link>
        </li>
      </ul>
    </div>
    <div
      :class="['flex-grow transition-all duration-300', { 'ml-64': isOpen, 'ml-0': !isOpen }]"
    >
      <!-- Main content goes here -->
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isOpen = ref(true)
const items = [
  { name: 'AZ Pricing', icon: 'fas fa-tachometer-alt', to: '/azpricing' },
  { name: 'US Pricing', icon: 'fas fa-user', to: '/usdomestic' },
  { name: 'AZ LCR', icon: 'fas fa-cog', to: '/lcr' },
  { name: 'US LCR', icon: 'fas fa-envelope', to: '/lcr' },
  { name: 'Dispute Engine', icon: 'fas fa-bell', to: '/dispute' },
  { name: 'Logout', icon: 'fas fa-sign-out-alt', to: '/logout' },
]

const toggleSidebar = () => {
  isOpen.value = !isOpen.value
}
</script>

<style scoped>
/* Custom styles if needed */
</style>
