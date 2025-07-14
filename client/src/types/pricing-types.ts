import { type Component } from 'vue';

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number | string; // Allow string for 'Custom'
  priceYearly: number | string; // Add yearly price
  priceIdMonthly?: string; // Stripe price ID for monthly
  priceIdYearly?: string; // Stripe price ID for yearly
  features: string[];
  isPopular?: boolean;
  ctaText: string;
  icon?: Component; // Optional icon
}
