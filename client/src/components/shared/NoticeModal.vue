<template>
  <Teleport to="body">
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center bg-fbBlack/80 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
    :class="modelValue ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    @click.self="closeModal"
  >
    <div
      class="w-full max-w-md transform rounded-lg bg-slate-800 p-6 shadow-xl transition-all duration-300 ease-in-out"
      :class="modelValue ? 'scale-100 opacity-100' : 'scale-95 opacity-0'"
    >
      <h3 class="mb-4 text-xl font-semibold" :class="titleClass">
        {{ title }}
      </h3>
      <p class="mb-6 text-sm text-slate-400" v-html="formattedMessage"></p>
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
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'info':
      default:
        return 'text-fbWhite';
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
