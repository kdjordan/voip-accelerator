<template>
  <span :class="badgeClasses">
    <slot></slot>
  </span>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { BaseBadgeProps } from '@/types/app-types';

  // Define props with defaults
  const props = withDefaults(defineProps<BaseBadgeProps>(), {
    variant: 'neutral',
    size: 'standard',
    uppercase: false,
  });

  // Base classes shared by all badges
  const baseClasses = 'inline-flex items-center font-medium';

  // Classes based on variant
  const variantClasses = computed(() => {
    switch (props.variant) {
      case 'accent':
        return 'bg-accent/10 border-accent/50 text-accent border rounded-full';
      case 'info':
        return 'bg-blue-900/30 border-blue-700/50 text-blue-300 border rounded-full';
      case 'success':
        return 'bg-green-900/30 border-green-700/50 text-green-300 border rounded-full';
      case 'warning':
        return 'bg-yellow-900/30 border-yellow-700/50 text-yellow-300 border rounded-full';
      case 'destructive':
        return 'bg-red-950/50 border-red-500/50 text-red-400 border rounded-full';
      case 'violet': // For memory storage example
        return 'bg-violet-900/30 border-violet-700/50 text-violet-300 border rounded-full';
      case 'neutral':
      default:
        return 'bg-gray-700 text-gray-200 ring-1 ring-inset ring-gray-600 rounded-md';
    }
  });

  // Classes based on size
  const sizeClasses = computed(() => {
    switch (props.size) {
      case 'small':
        return 'px-2 py-1 text-xs';
      case 'standard':
      default:
        return 'px-3 py-1 text-sm';
    }
  });

  // Uppercase class
  const uppercaseClass = computed(() => (props.uppercase ? 'uppercase' : ''));

  // Combine all classes
  const badgeClasses = computed(() => {
    return `${baseClasses} ${variantClasses.value} ${sizeClasses.value} ${uppercaseClass.value}`;
  });
</script>
