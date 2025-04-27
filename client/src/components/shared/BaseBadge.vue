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
const baseClasses = 'inline-flex items-center font-medium border rounded-full';

// Classes based on variant
const variantClasses = computed(() => {
  switch (props.variant) {
    case 'accent':
      return 'bg-accent/10 border-accent/50 text-accent';
    case 'info':
      return 'bg-blue-900/30 border-blue-700/50 text-blue-300';
    case 'success':
      return 'bg-green-900/30 border-green-700/50 text-green-300';
    case 'warning':
      return 'bg-yellow-900/30 border-yellow-700/50 text-yellow-300';
    case 'destructive':
      return 'bg-red-950/50 border-red-500/50 text-red-400';
    case 'violet': // For memory storage example
      return 'bg-violet-900/30 border-violet-700/50 text-violet-300';
    case 'neutral':
    default:
      return 'bg-gray-800/50 border-gray-700/50 text-gray-300';
  }
});

// Classes based on size
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'px-2 py-0.5 text-xs';
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
