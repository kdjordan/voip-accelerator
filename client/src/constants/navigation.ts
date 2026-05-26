import type { NavigationItem } from '@/types/nav-types';
import {
  HomeIcon,
  DocumentChartBarIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  AdjustmentsVerticalIcon,
} from '@heroicons/vue/24/outline';

// FLAT nav: with A-Z hidden (US-NPANXX focus) each section had a single child, so the
// dropdown sub-menus were removed — every route is now a direct link.
// To restore A-Z later: give Reporting / Rate Wizard a `children: [...]` array again (US + AZ)
// and reinstate the expandable rendering in SideNav.vue + AppMobileNav.vue.
export const appNavigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Reporting', href: '/usview', icon: DocumentChartBarIcon },
  { name: 'Rate Wizard', href: '/us-rate-sheet', icon: WrenchScrewdriverIcon },
  { name: 'Rate Generation', href: '/rate-gen/us', icon: SparklesIcon },
  {
    name: 'Admin',
    href: '/admin',
    icon: AdjustmentsVerticalIcon,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
];

// Example Marketing Navigation (Adjust as needed)
export const marketingNavigationItems: NavigationItem[] = [
  { name: 'Features', href: '/#features' },
];
