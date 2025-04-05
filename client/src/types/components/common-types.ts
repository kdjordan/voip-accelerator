import type { Component } from 'vue';

/**
 * Used for notification action buttons
 */
export interface NotificationAction {
  label: string;
  handler: () => void;
}

/**
 * Types of notifications that can be displayed
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Used for feature card layout in the home page
 */
export interface FeatureCard {
  id: number;
  icon: Component;
  title: string;
  description: string;
  rotate: string;
  yOffset: string;
}
