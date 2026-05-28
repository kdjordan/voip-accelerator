<template>
  <Teleport to="body">
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-300 ease-in-out"
    :class="modelValue ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    @click.self="closeModal"
  >
    <div
      class="w-full max-w-md transform border border-line-strong bg-surface p-6 transition-all duration-300 ease-in-out"
      :class="modelValue ? 'scale-100 opacity-100' : 'scale-95 opacity-0'"
    >
      <h3 class="mb-4 font-display text-lg font-semibold uppercase tracking-wider" :class="titleClass">
        {{ title }}
      </h3>
      <p class="mb-6 font-sans text-sm text-fg-dim" v-html="formattedMessage"></p>
      <div class="flex justify-end">
        <BaseButton
          variant="secondary"
          @click="closeModal"
        >
          {{ closeButtonText }}
        </BaseButton>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import BaseButton from '@/components/shared/BaseButton.vue';

  interface Props {
    modelValue: boolean; // Used for v-model
    title: string;
    message: string;
    variant?: 'success' | 'error' | 'info';
    closeButtonText?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    variant: 'info',
    closeButtonText: 'Close',
  });

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'close'): void;
  }>();

  const titleClass = computed(() => {
    switch (props.variant) {
      case 'success':
        return 'text-warn';
      case 'error':
        return 'text-down';
      case 'info':
      default:
        return 'text-fg';
    }
  });

  const formattedMessage = computed(() => {
    return props.message.replace(/\n/g, '<br>');
  });

  function closeModal() {
    emit('update:modelValue', false);
    emit('close');
  }
</script>
