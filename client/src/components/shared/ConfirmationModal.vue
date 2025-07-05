<template>
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
      <h3 class="mb-4 text-xl font-semibold text-fbWhite">
        {{ title }}
      </h3>
      <p class="mb-6 text-sm text-slate-400" v-html="formattedMessage"></p>
      <div v-if="requiresConfirmationPhrase" class="mb-6">
        <label for="confirmationPhraseInput" class="mb-2 block text-sm font-medium text-slate-300">
          To confirm, type "<strong class="text-accent">{{ confirmationPhrase }}</strong
          >" below:
        </label>
        <input
          id="confirmationPhraseInput"
          ref="confirmationInputRef"
          v-model="typedPhrase"
          type="text"
          class="w-full rounded-md border-slate-600 bg-slate-700 p-2.5 text-fbWhite placeholder-slate-500 focus:border-accent focus:ring-1 focus:ring-accent"
          :placeholder="confirmationPhrase"
          @keyup.enter="confirmAction"
        />
      </div>
      <div class="flex justify-end space-x-3">
        <BaseButton
          variant="secondary"
          @click="closeModal"
        >
          {{ cancelButtonText }}
        </BaseButton>
        <BaseButton
          :variant="confirmButtonVariant"
          :disabled="isConfirmDisabled"
          :loading="loading"
          @click="confirmAction"
        >
          {{ confirmButtonText }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue';
  import BaseButton from '@/components/shared/BaseButton.vue';

  interface Props {
    modelValue: boolean; // Used for v-model
    title: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    requiresConfirmationPhrase?: boolean;
    confirmationPhrase?: string;
    confirmButtonVariant?: 'primary' | 'secondary' | 'destructive' | 'secondary-outline';
    loading?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    requiresConfirmationPhrase: false,
    confirmationPhrase: 'DELETE',
    confirmButtonVariant: 'destructive',
    loading: false,
  });

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'confirm'): void;
    (e: 'cancel'): void;
  }>();

  const typedPhrase = ref('');
  const confirmationInputRef = ref<HTMLInputElement | null>(null);

  const isConfirmDisabled = computed(() => {
    if (props.requiresConfirmationPhrase) {
      return typedPhrase.value !== props.confirmationPhrase;
    }
    return false;
  });

  const formattedMessage = computed(() => {
    return props.message.replace(/\n/g, '<br>');
  });

  watch(
    () => props.modelValue,
    (newValue) => {
      if (newValue && props.requiresConfirmationPhrase) {
        nextTick(() => {
          confirmationInputRef.value?.focus();
        });
      }
    }
  );

  function closeModal() {
    typedPhrase.value = ''; // Reset for next time
    emit('update:modelValue', false);
    emit('cancel');
  }

  function confirmAction() {
    if (!isConfirmDisabled.value) {
      emit('confirm');
      // Do not automatically close modal here; parent decides after confirm action
      // closeModal();
    }
  }
</script>
