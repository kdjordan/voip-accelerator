<template>
  <button :type="type" :class="buttonClasses" :disabled="disabled">
    <!-- Render icon if provided -->
    <component v-if="icon" :is="icon" :class="iconClasses" aria-hidden="true" />
    <!-- Button text/content -->
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed, type Component, useSlots } from 'vue';
import type { BaseButtonProps } from '@/types/app-types';

// Define props with defaults
const props = withDefaults(defineProps<BaseButtonProps>(), {
  variant: 'primary',
  size: 'standard',
  type: 'button',
  disabled: false,
  icon: undefined,
});

// Get slots
const slots = useSlots();

// Base classes shared by all buttons
const baseClasses =
  'inline-flex items-center justify-center rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900'; // Added flex alignment for icon

// Classes based on variant
const variantClasses = computed(() => {
  switch (props.variant) {
    case 'destructive':
      return 'bg-red-950 text-red-400 border-red-500/50 hover:bg-red-900 active:bg-red-800 disabled:bg-slate-800/50 disabled:text-slate-500 disabled:border-slate-700 disabled:cursor-not-allowed focus:ring-red-500';
    case 'primary':
    default:
      return 'bg-accent/20 text-accent border-accent hover:bg-accent/30 active:bg-accent/40 disabled:bg-slate-800/50 disabled:text-slate-500 disabled:border-slate-700 disabled:cursor-not-allowed focus:ring-accent';
  }
});

// Classes based on size
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'px-2 py-1 text-xs';
    case 'standard':
    default:
      return 'px-6 py-2 text-sm';
  }
});

// Combine all classes
const buttonClasses = computed(() => {
  // Add leading/trailing space based on presence of slot content (button text)
  const paddingAdjustment = slots.default ? '' : 'px-0'; // Adjust padding if only icon exists, though less common
  return `${baseClasses} ${variantClasses.value} ${sizeClasses.value}`;
});

// Dynamically adjust icon classes based on size
const iconClasses = computed(() => {
  const baseIcon = 'shrink-0'; // Prevent icon from shrinking
  const hasText = !!slots.default; // Check if there is text content in the slot
  // Determine margin based on size and presence of text
  if (!hasText) return baseIcon; // No margin needed if only icon
  switch (props.size) {
    case 'small':
      return `${baseIcon} -ml-0.5 mr-1.5 h-4 w-4`; // Adjusted spacing for small
    case 'standard':
    default:
      return `${baseIcon} -ml-1 mr-2 h-5 w-5`; // Standard spacing
  }
});
</script>

<style scoped>
/* Add any component-specific styles here if needed, but prefer Tailwind utilities */
</style>
