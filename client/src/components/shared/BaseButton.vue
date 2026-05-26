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
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ink';

  // Classes based on variant
  const variantClasses = computed(() => {
    switch (props.variant) {
      case 'destructive':
        return 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30 hover:bg-rose-500/25 active:bg-rose-500/30 disabled:bg-zinc-800/50 disabled:text-zinc-500 disabled:ring-transparent disabled:cursor-not-allowed focus:ring-rose-400';
      case 'secondary': // Styles for the standard secondary button (like the current 'Use Highest')
        return 'border border-white/10 text-zinc-200 hover:bg-white/[0.05] active:bg-white/[0.08] disabled:text-zinc-600 disabled:border-white/5 disabled:cursor-not-allowed focus:ring-white/20';
      case 'secondary-outline': // Styles for the less prominent outline button (for 'Use Lowest')
        return 'border border-white/10 bg-transparent text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 active:bg-white/[0.06] disabled:text-zinc-600 disabled:border-white/5 disabled:cursor-not-allowed focus:ring-white/20';
      case 'primary':
      default:
        return 'bg-emerald-400 text-ink font-semibold hover:bg-emerald-300 active:bg-emerald-300 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed focus:ring-emerald-400';
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
