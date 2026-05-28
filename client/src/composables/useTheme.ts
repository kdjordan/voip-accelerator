import { ref, computed } from 'vue';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'va-theme';
const DEFAULT_THEME: Theme = 'dark';

// Module-level singleton — shared across every import.
const theme = ref<Theme>(DEFAULT_THEME);

/** Resolve a Theme (incl. 'system') to a concrete 'light' | 'dark'. */
function resolve(t: Theme): 'light' | 'dark' {
  if (t === 'system') {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }
  return t;
}

/** Write the resolved theme onto <html data-theme>. */
function apply(t: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolve(t));
}

/**
 * Boot the theme from localStorage (fallback 'dark'), apply it, and keep
 * 'system' in sync with the OS preference. Call once before app.mount.
 */
export function initTheme(): void {
  let stored: Theme = DEFAULT_THEME;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'light' || raw === 'dark' || raw === 'system') {
        stored = raw;
      }
    }
  } catch {
    stored = DEFAULT_THEME;
  }

  theme.value = stored;
  apply(stored);

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', () => {
      if (theme.value === 'system') apply(theme.value);
    });
  }
}

export function useTheme() {
  const resolvedTheme = computed(() => resolve(theme.value));

  function setTheme(t: Theme): void {
    theme.value = t;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, t);
      }
    } catch {
      // ignore storage failures (private mode, jsdom, etc.)
    }
    apply(t);
  }

  return { theme, resolvedTheme, setTheme };
}
