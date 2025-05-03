<template>
  <div
    class="relative inline-flex items-center rounded-full p-1 bg-fbBlack/20 backdrop-blur-sm border border-accent/20 cursor-pointer"
  >
    <div
      class="absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] bg-accent/20 rounded-full transition-transform duration-300 ease-out border border-accent/50"
      :style="{ transform: `translateX(${isMonthly ? '0%' : '100%'})` }"
    ></div>
    <button
      type="button"
      @click="emit('update:modelValue', true)"
      :class="[
        'relative z-10 w-1/2 rounded-full py-2 px-4 text-sm font-medium transition-colors duration-300',
        isMonthly ? 'text-accent' : 'text-fbWhite/70 hover:text-fbWhite',
      ]"
    >
      Monthly
    </button>
    <button
      type="button"
      @click="emit('update:modelValue', false)"
      :class="[
        'relative z-10 w-1/2 rounded-full py-2 px-4 text-sm font-medium transition-colors duration-300',
        !isMonthly ? 'text-accent' : 'text-fbWhite/70 hover:text-fbWhite',
      ]"
    >
      Yearly
    </button>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  interface Props {
    modelValue: boolean; // true for Monthly, false for Yearly
  }

  const props = defineProps<Props>();
  const emit = defineEmits(['update:modelValue']);

  const isMonthly = computed(() => props.modelValue);
</script>
