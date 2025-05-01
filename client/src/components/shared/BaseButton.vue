<template>
  <button :type="type" :class="buttonClasses" :disabled="disabled || loading">
    <!-- Loading State -->
    <span v-if="loading" class="flex items-center justify-center">
      <ArrowPathIcon :class="spinnerClasses" aria-hidden="true" />
      <!-- Optionally add loading text here if needed -->
    </span>
    <!-- Default State -->
    <span v-else class="inline-flex items-center justify-center">
      <component v-if="icon" :is="icon" :class="iconClasses" aria-hidden="true" />
      <slot></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, type Component, useSlots } from 'vue';
import { ArrowPathIcon } from '@heroicons/vue/20/solid'; // Import loading icon
import type { BaseButtonProps } from '@/types/app-types';

// Define props with defaults, including loading
const props = withDefaults(defineProps<BaseButtonProps>(), {
  variant: 'primary',
  size: 'standard',
  type: 'button',
  disabled: false,
  icon: undefined,
  loading: false, // Default loading to false
});

// Get slots
const slots = useSlots();

// Base classes shared by all buttons
const baseClasses =
  'inline-flex items-center justify-center rounded-md border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900'; // Adjusted font-medium

// Classes based on variant
const variantClasses = computed(() => {
  switch (props.variant) {
    case 'destructive':
      return 'bg-red-950 text-red-400 border-red-500/50 hover:bg-red-900 active:bg-red-800 disabled:bg-slate-800/50 disabled:text-slate-500 disabled:border-slate-700 disabled:cursor-not-allowed focus:ring-red-500';
    case 'secondary': // Styles for the standard secondary button (like the current 'Use Highest')
      return 'bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-700 active:bg-gray-600 disabled:bg-slate-800/50 disabled:text-slate-500 disabled:border-slate-700 disabled:cursor-not-allowed focus:ring-gray-500';
    case 'secondary-outline': // Styles for the less prominent outline button (for 'Use Lowest')
      return 'bg-transparent text-gray-400 border-gray-700 hover:bg-gray-800/50 hover:border-gray-600 hover:text-gray-300 active:bg-gray-800 disabled:bg-transparent disabled:text-slate-600 disabled:border-slate-800 disabled:cursor-not-allowed focus:ring-gray-600';
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

  // Determine size classes
  let sizeClass = '';
  switch (props.size) {
    case 'small':
      sizeClass = 'h-4 w-4';
      break;
    case 'standard':
    default:
      sizeClass = 'h-5 w-5';
      break;
  }

  // Add margins only if there is text
  if (hasText) {
    switch (props.size) {
      case 'small':
        return `${baseIcon} ${sizeClass} -ml-0.5 mr-1.5`;
      case 'standard':
      default:
        return `${baseIcon} ${sizeClass} -ml-1 mr-2`;
    }
  } else {
    // No text, just return base icon and size
    return `${baseIcon} ${sizeClass}`;
  }
});

// Classes for the loading spinner
const spinnerClasses = computed(() => {
  const baseSpinner = 'animate-spin shrink-0';
  // Use similar sizing as the regular icon
  switch (props.size) {
    case 'small':
      return `${baseSpinner} h-4 w-4`; // Match small icon size
    case 'standard':
    default:
      return `${baseSpinner} h-5 w-5`; // Match standard icon size
  }
});
</script>
