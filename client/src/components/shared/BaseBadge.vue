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

  // Base classes shared by all badges — Switchboard: mono, sharp 2px chip radius.
  const baseClasses =
    'inline-flex items-center font-display font-medium tracking-wide rounded-xs border';

  // Classes based on variant — token-mapped (portal positive axis = warn/amber,
  // accent = brand red). Each variant stays visually distinct.
  const variantClasses = computed(() => {
    switch (props.variant) {
      case 'accent':
        return 'bg-accent-soft text-accent-text border-accent-ring';
      case 'info':
        return 'bg-info-soft text-info border-info/30';
      case 'success':
        return 'bg-warn-soft text-warn border-warn/30';
      case 'warning':
        return 'bg-warn-soft text-warn border-warn/30';
      case 'destructive':
        return 'bg-down-soft text-down border-down/30';
      case 'violet': // For memory storage example
        return 'bg-violet-soft text-violet border-violet/30';
      case 'neutral':
      default:
        return 'bg-row text-fg-dim border-line';
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
