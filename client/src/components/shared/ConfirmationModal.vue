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
      <h3 class="mb-4 font-display text-lg font-semibold uppercase tracking-wider text-fg">
        {{ title }}
      </h3>
      <p class="mb-6 font-sans text-sm text-fg-dim" v-html="formattedMessage"></p>
      <div v-if="requiresConfirmationPhrase" class="mb-6">
        <label for="confirmationPhraseInput" class="mb-2 block font-sans text-sm font-medium text-fg-dim">
          To confirm, type "<strong class="text-accent">{{ confirmationPhrase }}</strong
          >" below:
        </label>
        <input
          id="confirmationPhraseInput"
          ref="confirmationInputRef"
          v-model="typedPhrase"
          type="text"
          class="w-full border border-line-strong bg-input px-3 py-2 font-display text-fg placeholder-fg-mute focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent"
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
  </Teleport>
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
