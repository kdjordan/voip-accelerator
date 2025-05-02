# Mobile Navigation Implementation Plan (Component-Based)

This plan outlines the steps to create two distinct mobile navigation menus using dedicated components: one for the main application views (`AppMobileNav.vue`) and one for the marketing/public pages (`MarketingMobileNav.vue`).

## 1. Update Shared Store (`client/src/stores/shared-store.ts`)

- **Add State:** Introduce `isAppMobileMenuOpen: false` to the `ui` state object.
- **Add Actions:** Create `setAppMobileMenuOpen(isOpen: boolean)` and `toggleAppMobileMenu()` actions.
- **Add Getter:** Create `getAppMobileMenuOpen` getter.
- **(Note:** `isSideNavOpen` remains for the desktop sidebar's expanded/collapsed state).

## 2. Create `AppMobileNav.vue` Component (`client/src/components/shared/AppMobileNav.vue`)

- **Purpose:** Handles the mobile navigation for the main application views.
- **Structure:**
  - **Mobile Header:** Contains logo/name and a hamburger button (`Bars3Icon`).
  - **Mobile Menu Panel:** Contains a close button (`XMarkIcon`) and the application navigation links.
- **Logic:**
  - Import and use `useSharedStore`.
  - Hamburger button calls `toggleAppMobileMenu` action.
  - Panel visibility controlled by `getAppMobileMenuOpen` getter.
  - Close button and navigation links call `setAppMobileMenuOpen(false)` action.
  - Use transitions for smooth opening/closing.
- **Props:** May need to receive the navigation `items` array as a prop (or import it from a shared location).
- **Styling:** Use Tailwind for layout, positioning (fixed header, absolute/fixed panel), background, z-index, and responsiveness.

## 3. Create `MarketingMobileNav.vue` Component (`client/src/components/shared/MarketingMobileNav.vue`)

- **Purpose:** Handles the mobile navigation for marketing/public pages (like `HomeView`).
- **Structure:**
  - **Mobile Header:** Contains logo/branding and a hamburger button (`Bars3Icon`).
  - **Mobile Menu Panel:** Contains a close button (`XMarkIcon`) and marketing-specific navigation links (Features, Pricing, Login, etc.).
- **Logic:**
  - Use a local `ref` (`isMarketingMobileMenuOpen = ref(false)`) to manage state.
  - Hamburger button toggles `isMarketingMobileMenuOpen.value`.
  - Panel visibility controlled by `isMarketingMobileMenuOpen`.
  - Close button and navigation links set `isMarketingMobileMenuOpen.value = false`.
  - Use transitions for smooth opening/closing.
- **Styling:** Use Tailwind for layout, positioning, background, z-index, and responsiveness.

## 4. Modify Application Layout (`client/src/App.vue` or Main Layout Component)

- **Import Components:** Import `AppMobileNav.vue` and `SideNav.vue`.
- **Conditional Rendering:**
  - Render `<AppMobileNav />` only on small screens (`block md:hidden`).
  - Render `<SideNav />` only on medium+ screens (`hidden md:block`).
- **Layout Adjustment:** Ensure the main content area adjusts its padding/margin to accommodate the fixed mobile header when visible.

## 5. Modify Marketing Pages (e.g., `client/src/pages/HomeView.vue`)

- **Import Components:** Import `MarketingMobileNav.vue` and `TopNav.vue` (if `TopNav` remains for desktop).
- **Conditional Rendering:**
  - Render `<MarketingMobileNav />` only on small screens (`block md:hidden`).
  - Render `<TopNav />` (or its desktop content) only on medium+ screens (`hidden md:flex`).

## 6. Update `TopNav.vue` (`client/src/components/shared/TopNav.vue`) - Optional Refactor

- Depending on the implementation, `TopNav.vue` might be refactored to _only_ contain the desktop navigation elements, as the mobile part is now handled by `MarketingMobileNav.vue`. Its main container would get `hidden md:flex` classes.

## 7. Update `SideNav.vue` (`client/src/components/shared/SideNav.vue`)

- No changes required for mobile logic. It remains responsible for its desktop expanded/collapsed state via the store.

## 8. Styling & Refinement

- Apply Tailwind classes consistently.
- Ensure proper `z-index` management.
- Test thoroughly on different screen sizes.
- Consider extracting the navigation `items` array from `SideNav.vue` to a shared location if needed by `AppMobileNav.vue`.
