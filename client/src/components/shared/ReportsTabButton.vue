<template>
  <button :class="buttonClasses" @click="handleClick">
    <span>{{ props.label }}</span>
    <template v-if="props.isActive">
      <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
    </template>
  </button>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  interface Props {
    label: string;
    isActive: boolean;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'click'): void;
  }>();

  const buttonClasses = computed(() => [
    'report-tab-button',
    props.isActive ? 'text-white' : 'text-gray-400',
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
