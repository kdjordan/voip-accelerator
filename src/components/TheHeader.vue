<template>
  <header class="w-full bg-muted text-foreground flex justify-between items-center px-8 h-16 border-b border-gray-600 z-30">
    <h1 class="tracking-widest text-center text-sizeBase">
        Telecom Toolkit
      </h1>
    <div class="relative">
      <button @click="toggleDropdown" class="flex items-center justify-center h-12 w-12 bg-gray-400 rounded-full text-xl font-bold text-white ">
        MG
      </button>
      <div v-if="dropdownOpen" class="absolute right-0 mt-2 w-64 bg-background rounded-md shadow-lg z-50">
        <div class="p-4">
          <div class="flex flex-col items-center mb-4">
            <h4 class="text-base text-foreground">Michael Gough</h4>
            <p class="text-sm text-gray-400">name@company.com</p>
          </div>
          <div class="w-full bg-gray-400 rounded-full h-2.5 mb-4">
            <div class="bg-accent h-2.5 rounded-full" style="width: 47%"></div>
          </div>
          <span class="text-sizeSm text-foreground block mb-2">70 of 150 GB remains</span>
          <button class="btn btn-primary w-full">
            Edit Profile
          </button>
          <button class="btn btn-primary w-full my-4">
            Upgrade to Pro
          </button>
          <button class="btn btn-destructive w-full">Logout</button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const dropdownOpen = ref(false);

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}
</script>