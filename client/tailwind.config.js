/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

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
      sans: ['Inter', 'sans-serif'],
      secondary: ['Roboto Mono', 'monospace'],
      // body: ['Open Sans', 'sans-serif'],
    },
    extend: {
      // NOTE: When using semi-transparent backgrounds for icon containers or similar elements
      // (e.g., bg-blue-900/30, bg-yellow-900/30, bg-accent/30),
      // always add a matching border with 50% opacity for consistency.
      // Example: `bg-blue-900/30 border border-blue-400/50`
      colors: {
        fbBlack: colors.gray['950'],
        fbWhite: colors.slate['300'],
        fbHover: colors.slate['800'],
        accent: 'hsl(160, 100%, 40%)',
        'accent-background': 'hsl(160, 100%, 40%, 0.2)',
        warning: colors.orange[400],
        'warning-background': `${colors.orange[400]}1A`,
        info: colors.blue[500],
        'info-background': `${colors.blue[500]}1A`,
        destructive: colors.red[400],
        'destructive-background': `${colors.red[400]}1A`,
      },
      fontSize: {
        xxs: ['0.65rem', '1rem'],
      },
      keyframes: {
        'upload-pulse': {
          '0%, 100%': {
            background: 'hsl(160, 100%, 40%, 0.1)',
          },
          '50%': {
            background: 'hsl(160, 100%, 40%, 0.2)',
          },
        },
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
        pulse: {
          '0%, 100%': {
            opacity: 0.5,
            transform: 'scale(0.95)',
          },
          '50%': {
            opacity: 1,
            transform: 'scale(1.05)',
          },
        },
        'opacity-pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'upload-pulse': 'upload-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'status-pulse-success':
          'status-pulse-success-shadow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'status-pulse-error': 'status-pulse-error-shadow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'status-pulse-warning':
          'status-pulse-warning-shadow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'animate-opacity-pulse': 'opacity-pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        spin: 'spin 1s linear infinite',
      },
    },
  },
};
