/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

// Switchboard token → CSS var bridge. Wrapping each var so Tailwind's slash
// alpha modifier (e.g. `bg-accent/20`, `border-fbWhite/20`) keeps working: a
// bare `var(--x)` string makes Tailwind silently drop alpha utilities and hard-
// fails `@apply token/alpha` in <style> blocks (many existing views rely on it).
// color-mix lets the var stay live so theme switching via `data-theme` is intact.
const v = (cssVar) =>
  ({ opacityValue } = {}) =>
    opacityValue === undefined || opacityValue === '1'
      ? `var(${cssVar})`
      : `color-mix(in srgb, var(${cssVar}) calc(${opacityValue} * 100%), transparent)`;

export default {
  content: [
    './pages/**/*.{ts,tsx,vue}',
    './components/**/*.{ts,tsx,vue}',
    './app/**/*.{ts,tsx,vue}',
    './src/**/*.{ts,tsx,vue}',
  ],
  theme: {
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      mono: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      display: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      // legacy keys repointed to Geist Mono so existing font-secondary/font-pt-mono auto-upgrade
      secondary: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      'pt-mono': ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
    },
    extend: {
      // NOTE: When using semi-transparent backgrounds for icon containers or similar elements
      // (e.g., bg-blue-900/30, bg-yellow-900/30, bg-accent/30),
      // always add a matching border with 50% opacity for consistency.
      // Example: `bg-blue-900/30 border border-blue-400/50`
      // ── Switchboard token bridge ────────────────────────────────────────
      // Every key below maps a Tailwind class onto a CSS var defined in
      // src/assets/index.css, so theme switching is automatic when
      // `data-theme` flips on <html>. Naming map for future workers:
      //   surfaces  → bg-canvas / bg-surface / bg-row / bg-row-hover / bg-input
      //   text      → text-fg / text-fg-dim / text-fg-faint / text-fg-mute
      //   borders   → border-line / border-line-strong / border-line-divider / rule
      //   accent    → accent / accent-strong / accent-text / accent-soft / accent-mid / accent-ring / accent-ink
      //   semantic  → up / down / warn / info / violet (+ -soft variants)
      //   legacy    → fbBlack/fbWhite/fbHover/ink/ink-raised/warning/destructive/*-background
      //               retained as aliases so existing classes re-theme automatically.
      // NOTE: Tailwind's DEFAULT palette (gray/zinc/emerald/red…) still resolves
      // via tailwindcss/colors — deferred surfaces rely on those literals until
      // later slices migrate them.
      colors: {
        // ── surfaces ──
        canvas: v('--bg'),
        surface: v('--bg-elev'),
        row: v('--bg-row'),
        'row-hover': v('--bg-row-hover'),
        input: v('--bg-input'),
        // ── text ladder ──
        fg: v('--text'),
        'fg-dim': v('--text-dim'),
        'fg-faint': v('--text-faint'),
        'fg-mute': v('--text-mute'),
        // ── borders / rules ──
        line: v('--border'),
        'line-strong': v('--border-strong'),
        'line-divider': v('--border-divider'),
        rule: v('--rule'),
        // ── accent (arterial red) ──
        accent: v('--accent'),
        'accent-strong': v('--accent-strong'),
        'accent-text': v('--accent-text'),
        'accent-soft': v('--accent-soft'),
        'accent-mid': v('--accent-mid'),
        'accent-ring': v('--accent-ring'),
        'accent-ink': v('--accent-ink'),
        // ── direction / semantic ──
        up: v('--up'),
        'up-soft': v('--up-soft'),
        down: v('--down'),
        'down-soft': v('--down-soft'),
        warn: v('--warn'),
        'warn-soft': v('--warn-soft'),
        info: v('--info'),
        'info-soft': v('--info-soft'),
        violet: v('--violet'),
        'violet-soft': v('--violet-soft'),
        // ── legacy aliases — re-theme existing classes automatically ──
        fbBlack: v('--bg'),
        fbWhite: v('--text'),
        fbHover: v('--bg-row-hover'),
        ink: v('--bg'),
        'ink-raised': v('--bg-elev'),
        warning: v('--warn'),
        destructive: v('--down'),
        'accent-background': v('--accent-soft'),
        'warning-background': v('--warn-soft'),
        'info-background': v('--info-soft'),
        'destructive-background': v('--down-soft'),
      },
      // Switchboard: flatten to radius 0, but keep genuine circles (`full`)
      // so status dots / avatars don't become squares.
      borderRadius: {
        none: '0',
        DEFAULT: '0',
        xs: '2px',
        sm: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '9999px',
      },
      fontSize: {
        xxs: ['0.65rem', '1rem'],
      },
      keyframes: {
        'status-pulse-success-shadow': {
          '0%, 100%': {
            opacity: 1,
            boxShadow: '0 0 0 0 theme(colors.accent/0.7)',
          },
          '50%': {
            opacity: 0.6,
            boxShadow: '0 0 0 6px theme(colors.accent/0)',
          },
        },
        'status-pulse-error-shadow': {
          '0%, 100%': {
            opacity: 1,
            boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)',
          },
          '50%': {
            opacity: 0.6,
            boxShadow: '0 0 0 6px rgba(244, 67, 54, 0)',
          },
        },
        'status-pulse-warning-shadow': {
          '0%, 100%': {
            opacity: 1,
            boxShadow: '0 0 0 0 theme(colors.warning/0.7)',
          },
          '50%': {
            opacity: 0.6,
            boxShadow: '0 0 0 6px theme(colors.warning/0)',
          },
        },
        'pulse-info-shadow': {
          '0%, 100%': {
            opacity: 1,
            boxShadow: '0 0 0 0 theme(colors.info/0.6)',
          },
          '50%': {
            opacity: 0.6,
            boxShadow: '0 0 0 6px theme(colors.info/0)',
          },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'status-pulse-success':
          'status-pulse-success-shadow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'status-pulse-error': 'status-pulse-error-shadow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'status-pulse-warning':
          'status-pulse-warning-shadow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-info': 'pulse-info-shadow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        spin: 'spin 1s linear infinite',
      },
    },
  },
};
