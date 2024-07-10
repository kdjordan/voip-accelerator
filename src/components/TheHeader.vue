<template>
  <nav class="w-full bg-background">
    <div class="w-full flex justify-between items-center h-[5rem] px-4 font-primary text-accent">
      <div>
        <h1 class="uppercase lg:text-sizeXl">Telecom Toolkit</h1>
      </div>
      <button
      @click="deleteIndexedDBDatabases(['az', 'us'])"
			class="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition ml-4"
		>
			RESET
		</button>

      <div class="ml-auto relative">
        <ul class="flex gap-8 whitespace-nowrap text-sizeSm uppercase">
          <li class="relative">
            <span class="cursor-pointer" @click="toggleDropdown">Pricing Tools</span>
            <ul
              v-if="isDropdownOpen"
              class="absolute left-0 mt-2 w-40 bg-white border border-gray-200 shadow-lg rounded-md z-10"
            >
              <li>
                <router-link
                  to="/azpricing"
                  class="block px-4 py-2 hover:bg-gray-100"
                  @click="closeDropdown"
                >
                  AZ
                </router-link>
              </li>
              <li>
                <router-link
                  to="/usdomestic"
                  class="block px-4 py-2 hover:bg-gray-100"
                  @click="closeDropdown"
                >
                  US Domestic
                </router-link>
              </li>
            </ul>
          </li>
          <li>
            <router-link to="/lcr" @click="closeDropdown">LCR Generator</router-link>
          </li>
          <li>
            <router-link to="/dispute" @click="closeDropdown">Dispute Resolution</router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { deleteIndexedDBDatabases } from '@/utils/resetIndexDb';
// const { deleteDataBase } = useIndexedDB();

const isDropdownOpen = ref(false);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  const dropdownElement = document.querySelector('.relative');
  if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
    closeDropdown();
  }
};

function deleteAllDBs() {

}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Your modal-specific styles here */
</style>
