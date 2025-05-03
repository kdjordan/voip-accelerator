import { type Component } from 'vue';

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number | string; // Can be a number or 'Contact Us'
  priceYearly?: number;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
  icon?: Component; // Optional icon
}
