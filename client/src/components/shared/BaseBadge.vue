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
  const baseClasses = 'inline-flex items-center font-medium rounded-md';

  // Classes based on variant
  const variantClasses = computed(() => {
    switch (props.variant) {
      case 'accent':
        return 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/30';
      case 'info':
        return 'bg-blue-400/10 text-blue-300 ring-1 ring-blue-400/30';
      case 'success':
        return 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/30';
      case 'warning':
        return 'bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/30';
      case 'destructive':
        return 'bg-rose-400/10 text-rose-300 ring-1 ring-rose-400/30';
      case 'violet': // For memory storage example
        return 'bg-violet-400/10 text-violet-300 ring-1 ring-violet-400/30';
      case 'neutral':
      default:
        return 'bg-zinc-400/10 text-zinc-300 ring-1 ring-zinc-400/30';
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
