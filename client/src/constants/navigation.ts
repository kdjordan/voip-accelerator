import type { NavigationItem } from '@/types/nav-types';
import {
  HomeIcon,
  DocumentChartBarIcon,
  GlobeAmericasIcon,
  GlobeAltIcon,
  WrenchScrewdriverIcon,
  AdjustmentsVerticalIcon,
  // Cog6ToothIcon, // Keep commented out if not used
} from '@heroicons/vue/24/outline';

export const appNavigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Reporting',
    icon: DocumentChartBarIcon,
    children: [
      {
        name: 'US Reporting',
        href: '/usview',
        icon: GlobeAmericasIcon,
      },
      {
        name: 'AZ Reporting',
        href: '/azview',
        icon: GlobeAltIcon,
      },
    ],
  },
  {
    name: 'Rate Wizard',
    icon: WrenchScrewdriverIcon,
    children: [
      {
        name: 'US Rate Wizard',
        href: '/us-rate-sheet',
        icon: AdjustmentsVerticalIcon,
      },
      {
        name: 'AZ Rate Wizard',
        href: '/az-rate-sheet',
        icon: AdjustmentsVerticalIcon,
      },
    ],
  },
  // {
  //   name: 'Lerg Admin',
  //   href: '/admin',
  //   icon: Cog6ToothIcon,
  // },
];

// Example Marketing Navigation (Adjust as needed)
export const marketingNavigationItems: NavigationItem[] = [
  { name: 'Features', href: '/#features' },
  // { name: 'Pricing', href: '/pricing' },
  // { name: 'About', href: '/about' },
  // Login/Signup are now handled explicitly in MarketingMobileNav panel
];
