/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{ts,tsx,vue}',
    './components/**/*.{ts,tsx,vue}',
    './app/**/*.{ts,tsx,vue}',
    './src/**/*.{ts,tsx,vue}',
  ],
  theme: {
    fontFamily: {
      // sans: ['"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      sans: ['Geist Sans', 'sans-serif'],
      // heading: ['Roboto', 'sans-serif'],
      // body: ['Open Sans', 'sans-serif'],
    },
    extend: {
      colors: {
        background: 'hsl(230, 20%, 10%)',
        foreground: 'hsl(180, 10%, 80%)',
        muted: 'hsl(230, 15%, 20%)',
        mutedForeground: 'hsl(180, 5%, 70%)',
        accent: 'hsl(160, 100%, 40%)',
        destructive: 'hsl(350, 100%, 50%)',
        destructiveForeground: 'hsl(0, 0%, 100%)',
        success: 'hsl(140, 100%, 40%)',
        fbBlack: 'hsl(230, 20%, 10%)',
        fbWhite: 'hsl(180, 10%, 80%)',
        fbGreen: 'hsl(140, 100%, 40%)',
        fbGray: 'hsl(220, 10%, 50%)',
        fbHover: 'hsl(230, 15%, 20%)',
        fbBorder: 'hsl(230, 15%, 40%)',
        fbLightMuted: 'hsl(180, 5%, 70%)',
      },
      fontSize: {
        sizeSm: 'clamp(0.8rem, 0.17vi + 0.76rem, 0.89rem)',
        sizeBase: 'clamp(1rem, 0.34vi + 0.91rem, 1.19rem)',
        sizeLg: 'clamp(1.25rem, 0.61vi + 1.1rem, 1.58rem)',
        sizeXl: 'clamp(1.56rem, 1vi + 1.31rem, 2.11rem)',
        size2xl: 'clamp(1.95rem, 1.56vi + 1.56rem, 2.81rem)',
        size3xl: 'clamp(2.44rem, 2.38vi + 1.85rem, 3.75rem)',
        size4xl: 'clamp(3.05rem, 3.54vi + 2.17rem, 5rem)',
        size5xl: 'clamp(3.81rem, 5.18vi + 2.52rem, 6.66rem)',
        size6xl: 'clamp(4.77rem, 7.48vi + 2.9rem, 8.88rem)',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { backgroundColor: 'var(--tw-success)' },
          '50%': { backgroundColor: 'color-mix(in hsl, var(--tw-success) 70%, white)' },
        },
      },
      animation: {
        pulse: 'pulse 1s infinite',
      },
    }
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        '.btn': {
          '@apply inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50': {},
        },
        '.btn-primary': {
          '@apply btn bg-accent text-white hover:bg-accent/90': {},
        },
        '.btn-secondary': {
          '@apply btn bg-muted text-foreground hover:bg-muted/80': {},
        },
        '.btn-destructive': {
          '@apply btn bg-destructive text-destructiveForeground hover:bg-destructive/90': {},
        },
        '.btn-outline': {
          '@apply btn border border-foreground/20 bg-transparent hover:bg-muted/50': {},
        },
        '.btn-ghost': {
          '@apply btn hover:bg-muted/50': {},
        },
        '.btn-link': {
          '@apply btn text-accent underline-offset-4 hover:underline': {},
        },
        // Size variants
        '.btn-sm': {
          '@apply h-8 px-3 text-xs': {},
        },
        '.btn-lg': {
          '@apply h-12 px-12 text-lg': {},
        },
        '.btn-accent': {
          '@apply border border-accent/50 rounded-lg hover:bg-accent/50 transition-colors': {},
        },
        '.btn-destructive': {
          '@apply border border-destructive/50 rounded-lg hover:bg-destructive/50 hover:text-fbBlack transition-colors': {},
        },
        '.btn-active': {
          '@apply bg-fbWhite text-fbBlack': {},
        },
        '.btn-inactive': {
          '@apply bg-fbHover text-fbWhite hover:bg-fbWhite hover:text-fbBlack transition-colors': {},
        },
        '.select-custom': {
          '@apply appearance-none pr-10': {},
          'background-image': 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke-width=\'1.5\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9\'/%3E%3C/svg%3E")',
          'background-position': 'right 0.5rem center',
          'background-repeat': 'no-repeat',
          'background-size': '1.5em 1.5em',
        },
      });
    },
  ],
};