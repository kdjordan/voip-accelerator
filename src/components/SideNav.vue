<template>
   <div :class="['sidebar', { 'collapsed': !isOpen }, 'bg-background text-foreground rounded-tr-xl rounded-br-xl border border-muted']">
    <!-- <div class="p-4 flex items-center justify-between pt-10 relative">
      <button @click="toggleSidebar" class="focus:outline-none absolute right-4 top-4">
        <ChevronRightIcon
          :class="{ 'rotate-180': !isOpen }"
          class="w-10 h-10 transition-transform duration-300 text-primary"
        />
      </button>
    </div> -->
    <ul>
      <li v-for="item in items" :key="item.name" class="p-4 hover:bg-muted hover:text-foreground">
        <router-link :to="item.to" class="flex items-center space-x-2"  exactActiveClass="border-indigo-500">
          <component :is="item.icon" class="w-6 h-6 text-foreground" />
          <span v-if="isOpen">{{ item.name }}</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  ChevronRightIcon,
  CurrencyDollarIcon,
  ArrowsPointingOutIcon,
  DocumentTextIcon,
} from '@heroicons/vue/24/outline';

const isOpen = ref(true);

function toggleSidebar() {
  isOpen.value = !isOpen.value;
}

const items = ref([
  {
    name: "AZ Pricing",
    to: "/azpricing",
    icon: CurrencyDollarIcon
  },
  {
    name: "US Pricing",
    to: "/uspricing",
    icon: CurrencyDollarIcon
  },
  {
    name: "AZ LCR",
    to: "/lcr",
    icon: ArrowsPointingOutIcon
  },
  {
    name: "US LCR",
    to: "/lcr",
    icon: ArrowsPointingOutIcon
  },
  {
    name: "Dispute Engine",
    to: "/disputes",
    icon: DocumentTextIcon
  },
  {
    name: "Logout",
    to: "/disputes",
    icon: DocumentTextIcon
  }
]);
</script>

<style scoped>
.sidebar {
  width: 200px;
  transition: width 0.3s;
  overflow: hidden;
  border-radius: 1rem; /* Upper right and lower right corners rounded */
  display: inline-block; /* Makes the sidebar only as tall as its content */
  position: fixed; /* Makes the sidebar fixed relative to the BODY */
  top: calc(100vh / 4); /* Aligns the sidebar to the top of the viewport */
  left: 1%; /* Aligns the sidebar to the left of the viewport */
  height: auto; /* Ensures the sidebar height adjusts to the content */
  z-index: 1000; /* Ensures the sidebar is above other content */
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

.active {
  background-color: var(--primary); /* Customize the active background color */
  color: var(--primary-foreground); /* Customize the active text color */
}
</style>