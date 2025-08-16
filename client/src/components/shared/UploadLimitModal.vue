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
      <!-- Header -->
      <div class="mb-4 text-center">
        <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20">
          <svg class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-fbWhite">
          Upload Limit Reached
        </h3>
      </div>

      <!-- Content -->
      <div class="mb-6 text-center text-sm text-slate-400">
        <p class="mb-3">
          You've reached your monthly upload limit of <span class="font-medium text-white">{{ uploadLimit }}</span> files.
        </p>
        <p class="mb-4">
          Currently using: <span class="font-medium text-white">{{ uploadsUsed }}/{{ uploadLimit }}</span>
        </p>
        <p>
          Upgrade to <span class="font-medium text-accent">Optimizer</span> for unlimited uploads and unlock the full power of VoIP Accelerator.
        </p>
      </div>

      <!-- Upgrade Benefits -->
      <div class="mb-6 rounded-lg bg-slate-700/50 p-4">
        <h4 class="mb-2 text-sm font-medium text-white">Optimizer Benefits:</h4>
        <ul class="space-y-1 text-xs text-slate-300">
          <li class="flex items-center">
            <svg class="mr-2 h-3 w-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            Unlimited file uploads
          </li>
          <li class="flex items-center">
            <svg class="mr-2 h-3 w-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            Advanced rate analysis
          </li>
          <li class="flex items-center">
            <svg class="mr-2 h-3 w-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            Priority support
          </li>
        </ul>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <BaseButton
          variant="secondary"
          size="small"
          @click="closeModal"
          class="sm:w-auto w-full"
        >
          Maybe Later
        </BaseButton>
        <BaseButton
          variant="primary"
          size="small"
          @click="handleUpgrade"
          class="sm:w-auto w-full"
        >
          Upgrade to Optimizer - $99/mo
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { defineEmits, defineProps } from 'vue';
  import BaseButton from '@/components/shared/BaseButton.vue';

  interface Props {
    modelValue: boolean;
    uploadsUsed: number;
    uploadLimit: number;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    'upgrade-clicked': [];
  }>();

  function closeModal() {
    emit('update:modelValue', false);
  }

  function handleUpgrade() {
    emit('upgrade-clicked');
    closeModal();
  }
</script>