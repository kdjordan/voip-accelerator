<template>
  <nav
    :class="[
      'sidebar',
      { collapsed: !isOpen },
      'bg-background border-r border-t border-muted min-w-[200px] fixed top-0 left-0 bottom-0 pt-4',
    ]"
  >
    <div class="px-4 flex flex-col relative">
      <h1 class="tracking-widest text-center text-sizeBase">
        Telecom Toolkit
      </h1>
    </div>
    <hr class="my-4 border border-gray-600 rounded w-[100%] m-auto" />
    <ul class="flex-grow pt-8">
      <li
        v-for="item in items"
        :key="item.name"
        class="pl-4 hover:bg-muted hover:text-muted-foreground"
      >
        <RouterLink
          :to="item.to"
          class="flex items-center space-x-2 py-4"
          active-class="active-link"
        >
          <component :is="item.icon" class="w-6 h-6" />
          <span v-if="isOpen">{{ item.name }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { ref } from 'vue';
import {
  DocumentCurrencyDollarIcon,
  BarsArrowDownIcon,
  PercentBadgeIcon,
} from '@heroicons/vue/24/outline';

const isOpen = ref(true);

function toggleSidebar() {
  isOpen.value = !isOpen.value;
}

const items = ref([
  {
    name: 'AZ Pricing',
    to: '/azpricing',
    icon: DocumentCurrencyDollarIcon,
  },
  {
    name: 'US Pricing',
    to: '/uspricing',
    icon: DocumentCurrencyDollarIcon,
  },
  {
    name: 'AZ LCR',
    to: '/lcr',
    icon: BarsArrowDownIcon,
  },
  {
    name: 'US LCR',
    to: '/lcr',
    icon: BarsArrowDownIcon,
  },
  {
    name: 'Dispute Engine',
    to: '/disputes',
    icon: PercentBadgeIcon,
  },
]);
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 200px;
  transition: width 0.3s;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 20;
}

.active-link {
  background-color: hsl(220, 20%, 20%);
  color: hsl(120, 100%, 40%);
}
</style>
