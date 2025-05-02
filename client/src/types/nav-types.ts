import type { FunctionalComponent, HTMLAttributes, VNodeProps } from 'vue';

export interface NavigationItem {
  name: string;
  href: string;
  icon?: FunctionalComponent<HTMLAttributes & VNodeProps>;
  current?: boolean; // Optional: indicates if the item is the current page
}
