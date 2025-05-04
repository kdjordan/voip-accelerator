import type { FunctionalComponent, HTMLAttributes, VNodeProps } from 'vue';

export interface NavigationItem {
  name: string;
  href?: string; // Make href optional as parent items might not have one
  icon?: FunctionalComponent<HTMLAttributes & VNodeProps>;
  current?: boolean; // Optional: indicates if the item is the current page
  children?: NavigationItem[]; // Optional: for nested navigation items
  meta?: {
    // Optional meta information for routing logic
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
    hideWhenAuthed?: boolean;
  };
}
