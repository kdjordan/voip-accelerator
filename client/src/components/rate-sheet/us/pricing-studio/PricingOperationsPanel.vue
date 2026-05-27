<template>
  <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-secondary uppercase tracking-wider text-zinc-400">Recent Changes</h3>
        <span
          v-if="operations.length"
          class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white/10 text-[10px] font-secondary text-zinc-300"
        >
          {{ operations.length }}
        </span>
      </div>
      <button
        v-if="operations.length && showAll"
        @click="psStore.clearOperations()"
        class="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        Clear All
      </button>
    </div>

    <p v-if="!operations.length" class="text-sm text-zinc-500 py-4">
      No changes yet. Apply an adjustment to see it here.
    </p>

    <template v-else>
      <!-- Collapsed: a deck — newest change on top, older ones peeking beneath -->
      <div v-if="!showAll">
        <div class="relative">
          <div
            v-if="operations.length > 2"
            class="pointer-events-none absolute inset-x-3 top-0 h-full rounded-lg border border-white/[0.05] bg-white/[0.02]"
            style="transform: translateY(14px) scale(0.96)"
          ></div>
          <div
            v-if="operations.length > 1"
            class="pointer-events-none absolute inset-x-1.5 top-0 h-full rounded-lg border border-white/[0.06] bg-white/[0.02]"
            style="transform: translateY(7px) scale(0.98)"
          ></div>
          <div class="relative"><OperationCard :op="reversed[0]" /></div>
        </div>
        <button
          @click="showAll = true"
          class="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.06] transition-colors"
        >
          Review all {{ operations.length }} changes
          <ChevronDownIcon class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Expanded: full scrollable list (newest first) -->
      <div v-else>
        <div class="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          <OperationCard v-for="op in reversed" :key="op.id" :op="op" />
        </div>
        <button
          @click="showAll = false"
          class="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.06] transition-colors"
        >
          Collapse
          <ChevronDownIcon class="h-3.5 w-3.5 rotate-180" />
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { ChevronDownIcon } from '@heroicons/vue/20/solid';
  import { usePricingStudioStore } from '@/stores/pricing-studio-store';
  import OperationCard from '@/components/rate-sheet/us/pricing-studio/OperationCard.vue';

  const psStore = usePricingStudioStore();
  const operations = computed(() => psStore.operations);
  const reversed = computed(() => [...psStore.operations].reverse());
  const showAll = ref(false);
</script>
