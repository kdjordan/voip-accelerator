import { type Component } from 'vue';

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number | string; // Allow string for 'Custom'
  priceYearly: number | string; // Add yearly price
  features: string[];
  isPopular?: boolean;
  ctaText: string;
  icon?: Component; // Optional icon
}
