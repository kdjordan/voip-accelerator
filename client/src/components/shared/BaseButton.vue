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

  // Base classes shared by all buttons — Switchboard: mono UPPERCASE, radius 0,
  // sharp focus ring (no offset), no scale/shift on hover.
  const baseClasses =
    'inline-flex items-center justify-center font-display font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-accent-ring';

  // Classes based on variant
  const variantClasses = computed(() => {
    switch (props.variant) {
      case 'destructive':
        return 'bg-down-soft text-down border border-down hover:bg-down/20 active:bg-down/25 disabled:bg-row disabled:text-fg-mute disabled:border-line disabled:cursor-not-allowed';
      case 'secondary': // Standard secondary/outline button
        return 'border border-line-strong bg-transparent text-fg hover:bg-row active:bg-row-hover disabled:text-fg-mute disabled:border-line disabled:cursor-not-allowed';
      case 'secondary-outline': // Less prominent outline button
        return 'border border-line-strong bg-transparent text-fg-dim hover:bg-row hover:text-fg active:bg-row-hover disabled:text-fg-mute disabled:border-line disabled:cursor-not-allowed';
      case 'primary':
      default:
        return 'bg-accent text-accent-ink hover:bg-accent active:bg-accent disabled:bg-row disabled:text-fg-mute disabled:border disabled:border-line disabled:cursor-not-allowed';
    }
  });

  // Classes based on size
  const sizeClasses = computed(() => {
    switch (props.size) {
      case 'small':
        return 'px-3 py-1.5 text-[11px]';
      case 'standard':
      default:
        return 'px-[18px] py-[11px] text-xs';
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
