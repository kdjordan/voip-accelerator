<template>
  <button :class="buttonClasses" :disabled="props.isLoading" @click="handleClick">
    <div class="flex items-center gap-2">
      <!-- ArrowPath spinner when loading -->
      <ArrowPathIcon 
        v-if="props.isLoading" 
        class="animate-spin h-4 w-4 text-current" 
      />
      <span>{{ props.label }}</span>
    </div>
    <template v-if="props.isActive">
      <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
    </template>
  </button>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { ArrowPathIcon } from '@heroicons/vue/20/solid';

  interface Props {
    label: string;
    isActive: boolean;
    isLoading?: boolean;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'click'): void;
  }>();

  const buttonClasses = computed(() => [
    'report-tab-button',
    props.isActive ? 'text-white' : 'text-gray-400',
    props.isLoading ? 'cursor-not-allowed opacity-75' : '',
  ]);

  function handleClick() {
    emit('click');
  }
</script>

<style scoped>
  .report-tab-button {
    @apply mr-8 py-4 px-1 relative hover:text-white transition-colors;
  }
</style>
