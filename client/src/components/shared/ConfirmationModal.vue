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
      <p class="mb-6 text-sm text-slate-400 whitespace-pre-line">
        {{ message }}
      </p>
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
        <button
          type="button"
          class="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors"
          @click="closeModal"
        >
          {{ cancelButtonText }}
        </button>
        <button
          type="button"
          :class="[
            'rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2  focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors',
            isConfirmDisabled
              ? 'cursor-not-allowed bg-slate-600 opacity-70'
              : 'bg-destructive hover:bg-red-500 focus:ring-destructive',
          ]"
          :disabled="isConfirmDisabled"
          @click="confirmAction"
        >
          {{ confirmButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue';

  interface Props {
    modelValue: boolean; // Used for v-model
    title: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    requiresConfirmationPhrase?: boolean;
    confirmationPhrase?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    requiresConfirmationPhrase: false,
    confirmationPhrase: 'DELETE',
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
