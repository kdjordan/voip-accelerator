<template>
  <nav
    :class="[
      'sidebar',
      { collapsed: !isOpen },
      'bg-background text-foreground rounded-tr-xl rounded-br-xl border border-muted',
    ]"
  >
    <div class="p-4 flex flex-col pt-10 relative">
      <h1 class="text-primary tracking-widest text-center">Telecom Toolkit</h1>
    </div>
    <hr class="my-8 border border-gray-600 rounded w-[90%] m-auto" />
    <ul class="flex-grow">
      <li
        v-for="item in items"
        :key="item.name"
        class="pl-4 hover:bg-muted hover:text-foreground"
      >
        <RouterLink
          :to="item.to"
          class="flex items-center space-x-2 py-2"
          active-class="active-link"
        >
          <component :is="item.icon" class="w-6 h-6 text-foreground" />
          <span v-if="isOpen">{{ item.name }}</span>
        </RouterLink>
      </li>
    </ul>
    <hr class="my-8 border border-gray-600 rounded w-[90%] m-auto" />
      <!-- User Profile Section -->
    <div class="profile-section p-4">
      <div class="flex flex-col items-center mb-4">
        <div
          class="w-12 h-12 rounded-full bg-primary text-foreground flex items-center justify-center mb-2"
        >
          <span class="text-xl font-bold text-background">MG</span>
        </div>
        <h4 class="text-base font-medium">Michael Gough</h4>
        <p class="text-sm text-muted">name@company.com</p>
      </div>
      <Button class="w-full py-2 mb-4 bg-muted rounded-lg border border-foreground">
        <DocumentTextIcon class="w-5 h-5 mr-2" /> Logout
      </Button>
      <!-- Space Indicator -->
      <div class="flex justify-between items-center mb-2">
        <span v-if="isOpen">Space left</span>
        <span>70 of 150 GB</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div class="bg-green-600 h-2.5 rounded-full" style="width: 47%"></div>
      </div>
      <button class="bg-primary text-foreground w-full py-2 rounded-lg">
        Upgrade to Pro
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import {
  ChevronRightIcon,
  CurrencyDollarIcon,
  ArrowsPointingOutIcon,
  DocumentTextIcon,
} from '@heroicons/vue/24/outline';
import { RouterLink } from 'vue-router';

const isOpen = ref(true);

function toggleSidebar() {
  isOpen.value = !isOpen.value;
}

const items = ref([
  {
    name: 'AZ Pricing',
    to: '/azpricing',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'US Pricing',
    to: '/uspricing',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'AZ LCR',
    to: '/lcr',
    icon: ArrowsPointingOutIcon,
  },
  {
    name: 'US LCR',
    to: '/lcr',
    icon: ArrowsPointingOutIcon,
  },
  {
    name: 'Dispute Engine',
    to: '/disputes',
    icon: DocumentTextIcon,
  },
  {
    name: 'Logout',
    to: '/disputes',
    icon: DocumentTextIcon,
  },
]);
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 200px;
  transition: width 0.3s;
  overflow: hidden;
  border-radius: 0 1rem 1rem 0; /* Upper right and lower right corners rounded */
  height: 100vh; /* Ensures the sidebar height adjusts to the content */
  z-index: 10; /* Ensures the sidebar is above other content */
}
.collapsed {
  width: 60px;
}

.icon {
  width: 24px;
  height: 24px;
}

.rotate-180 {
  transform: rotate(180deg);
}

ul {
  padding-left: 0;
  flex-grow: 1;
}

li {
  display: flex;
  align-items: center;
}

li .flex {
  flex-grow: 1;
  justify-content: flex-start;
}

button {
  background: none;
  border: none;
  color: var(--foreground);
}

button .focus\:outline-none:focus {
  outline: none;
}

.active-linke {
  background-color: var(
    --primary
  ); /* Customize the active background color */
  color: var(
    --primary-foreground
  ); /* Customize the active text color */
}

.profile-section {
  margin-top: auto;
}
</style>
