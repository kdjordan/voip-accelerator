# Design System Standardization

**Goal:** Define and implement a consistent set of styles for UI elements, starting with buttons, to improve UI consistency, maintainability, and developer experience across the VoIP Accelerator application. This involves:

1.  Defining standard button variants (primary, secondary, etc.), sizes, and states (hover, active, disabled).
2.  Documenting these standards in this file.
3.  Implementing reusable component classes in `tailwind.config.js`.
4.  Refactoring the application to use these standardized classes.

---

## Colors and combinations

Here are the base colors currently defined in `client/tailwind.config.js`:

- **`fbBlack`**: Mapped to `colors.gray['950']`. Primary dark background.
- **`fbWhite`**: Mapped to `colors.slate['300']`. Primary light text/elements on dark backgrounds.
- **`fbHover`**: Mapped to `colors.slate['800']`. Hover states on dark elements.
- **`accent`**: `hsl(160, 100%, 40%)`. The main accent color (used for active states, primary actions).
- **`destructive`**: `hsl(350, 100%, 50%)` - Used for destructive actions or error states.

We still need to define the specific shades of **red** identified in `USDetailedComparisonTable.vue` (e.g., `red-300`, `red-700`, `red-900`) if they are not covered by the `destructive` color or if we need finer control for specific UI elements like badges.

Our standard **destructive/danger** color set, based on the 'Remove' button in `USCodeSummary.vue`, uses the following standard Tailwind shades:

- **Text:** `text-red-400`
- **Background:** `bg-red-950`
- **Border:** `border-red-500/50` (50% opacity)
- **Hover Background:** `hover:bg-red-900`

**Neutral/Gray Colors:**
These have been mapped to standard Tailwind shades in `tailwind.config.js` (see above).

## Button Styles

### 1. Primary Button

Based on the active link style in `SideNav.vue`.

**Core Classes:** `px-4 py-2 rounded-md border transition-colors` (Base padding/rounding/border/transition - adjust padding for size variants later)

- **Default:**
  - `bg-accent/20`
  - `text-accent`
  - `border-accent`
- **Hover:**
  - `hover:bg-accent/30`
- **Active:** (When clicked)
  - `active:bg-accent/40`
- **Disabled:**
  - `disabled:bg-slate-800/50`
  - `disabled:text-slate-500`
  - `disabled:border-slate-700`
  - `disabled:cursor-not-allowed`

## Typography

Use standard Tailwind font size utility classes (e.g., `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, etc.).
Apply responsive variants as needed (e.g., `md:text-lg`, `lg:text-xl`).

_(Note: Custom fluid font sizes (`text-sizeSm`, etc.) have been removed from the configuration in favor of standard Tailwind classes.)_

_(Define specific button styles below)_
