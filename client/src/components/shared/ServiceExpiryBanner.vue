<template>
  <div v-if="show" :class="bannerClasses" class="relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between flex-wrap">
        <div class="flex-1 flex items-center">
          <span class="flex p-2 rounded-lg" :class="iconBgClass">
            <svg class="h-6 w-6" :class="textColorClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                :d="variant === 'error' ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' : 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'" 
              />
            </svg>
          </span>
          <p class="ml-3 font-medium" :class="textColorClass">
            {{ message }}
          </p>
        </div>
        <div class="flex-shrink-0 order-2 sm:order-3 sm:ml-3">
          <BaseButton
            @click="$emit('upgrade-clicked')"
            :variant="variant === 'error' ? 'primary' : 'secondary'"
            size="sm"
            class="shadow-sm"
          >
            {{ buttonText }}
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseButton from '@/components/shared/BaseButton.vue';

interface Props {
  show: boolean;
  message: string;
  variant?: 'error' | 'warning' | 'info';
  buttonText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'error',
  buttonText: 'Subscribe Now'
});

const emit = defineEmits<{
  'upgrade-clicked': [];
}>();

const bannerClasses = computed(() => {
  switch (props.variant) {
    case 'error':
      return 'bg-red-950 border-red-500/50 border rounded-lg py-4 mx-4 mb-4';
    case 'warning':
      return 'bg-orange-950 border-orange-500/50 border rounded-lg py-4 mx-4 mb-4';
    case 'info':
      return 'bg-blue-950 border-blue-500/50 border rounded-lg py-4 mx-4 mb-4';
    default:
      return 'bg-red-950 border-red-500/50 border rounded-lg py-4 mx-4 mb-4';
  }
});

const iconBgClass = computed(() => {
  switch (props.variant) {
    case 'error':
      return 'bg-red-900';
    case 'warning':
      return 'bg-orange-900';
    case 'info':
      return 'bg-blue-900';
    default:
      return 'bg-red-900';
  }
});

const textColorClass = computed(() => {
  switch (props.variant) {
    case 'error':
      return 'text-red-400';
    case 'warning':
      return 'text-orange-400';
    case 'info':
      return 'text-blue-400';
    default:
      return 'text-red-400';
  }
});
</script>