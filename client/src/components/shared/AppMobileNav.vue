<template>
  <div class="block md:hidden">
    <!-- Mobile Header -->
    <header
      class="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b bg-fbBlack border-accent px-4 shadow-sm"
    >
      <!-- Updated Logo/App Name -->
      <RouterLink to="/home" class="flex items-center text-accent gap-2">
        <BoltIcon class="w-8 h-8 flex-shrink-0" />
        <span class="font-medium font-secondary text-accent whitespace-nowrap tracking-tighter">
          VoIP Accelerator
        </span>
      </RouterLink>

      <!-- Hamburger Button -->
      <button
        type="button"
        class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-neutral-300"
        @click="toggleMenu"
      >
        <span class="sr-only">Open main menu</span>
        <Bars3Icon class="h-6 w-6" aria-hidden="true" />
      </button>
    </header>

    <!-- Mobile Menu Panel -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div v-if="isAppMobileMenuOpen" class="fixed inset-0 z-50 overflow-y-auto bg-fbBlack p-4">
        <div class="flex items-center justify-between">
          <!-- Updated Logo/App Name in Panel -->
          <RouterLink to="/home" class="flex items-center text-accent gap-2" @click="closeMenu">
            <BoltIcon class="w-8 h-8 flex-shrink-0" />
            <span class="font-medium font-secondary text-accent whitespace-nowrap tracking-tighter">
              VoIP Accelerator
            </span>
          </RouterLink>

          <!-- Close Button -->
          <button type="button" class="-m-2.5 rounded-md p-2.5 text-neutral-300" @click="closeMenu">
            <span class="sr-only">Close menu</span>
            <XMarkIcon class="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div class="mt-6 flow-root">
          <div class="-my-6 divide-y divide-neutral-700">
            <div class="space-y-1 py-6">
              <!-- Loop through navigation items -->
              <div v-for="(item, index) in items" :key="item.name">
                <!-- Regular Link Item -->
                <RouterLink
                  v-if="!item.children"
                  :to="item.href!"
                  class="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-neutral-800"
                  @click="closeMenu"
                >
                  {{ item.name }}
                </RouterLink>

                <!-- Expandable Section -->
                <div v-else>
                  <button
                    type="button"
                    class="-mx-3 flex w-full items-center justify-between rounded-lg py-2 px-3 text-base font-semibold leading-7 text-white hover:bg-neutral-800"
                    @click="toggleSection(index)"
                  >
                    {{ item.name }}
                    <ChevronDownIcon
                      :class="[
                        'h-5 w-5 flex-none transition-transform duration-200',
                        expandedSections[index] ? 'rotate-180' : '',
                      ]"
                      aria-hidden="true"
                    />
                  </button>
                  <!-- Expanded Content -->
                  <div v-if="expandedSections[index]" class="mt-1 ml-4 pl-3">
                    <RouterLink
                      v-for="child in item.children"
                      :key="child.name"
                      :to="child.href!"
                      class="block rounded-lg py-2 pl-3 pr-3 text-sm leading-7 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                      @click="closeMenu"
                    >
                      {{ child.name }}
                    </RouterLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { RouterLink } from 'vue-router';
  import { Bars3Icon, XMarkIcon, BoltIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';
  import { useSharedStore } from '@/stores/shared-store';
  import type { NavigationItem } from '@/types/nav-types';

  // Props
  interface Props {
    items: NavigationItem[];
  }
  const props = defineProps<Props>();

  // Store
  const sharedStore = useSharedStore();
  const isAppMobileMenuOpen = computed(() => sharedStore.getAppMobileMenuOpen);

  // Local state for expanded sections
  const expandedSections = ref<Record<number, boolean>>({});

  // Methods
  function toggleMenu(): void {
    sharedStore.toggleAppMobileMenu();
  }

  function closeMenu(): void {
    sharedStore.setAppMobileMenuOpen(false);
    expandedSections.value = {}; // Collapse sections when menu closes
  }

  function toggleSection(index: number): void {
    expandedSections.value[index] = !expandedSections.value[index];
  }
</script>
