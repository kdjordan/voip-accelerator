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
      colors: {
        fbBlack: colors.gray['950'],
        fbWhite: colors.slate['300'],
        fbHover: colors.slate['800'],
        accent: 'hsl(160, 100%, 40%)',
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
        'status-pulse-success': {
          '0%, 100%': {
            opacity: 1,
            boxShadow: '0 0 0 0 rgba(var(--accent) / 0.7)',
          },
          '50%': {
            opacity: 0.6,
            boxShadow: '0 0 0 6px rgba(var(--accent) / 0)',
          },
        },
        'status-pulse-error': {
          '0%, 100%': {
            opacity: 1,
            boxShadow: '0 0 0 0 rgba(var(--destructive) / 0.7)',
          },
          '50%': {
            opacity: 0.6,
            boxShadow: '0 0 0 6px rgba(var(--destructive) / 0)',
          },
        },
      },
      animation: {
        'upload-pulse': 'upload-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'status-pulse-success': 'status-pulse-success 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'status-pulse-error': 'status-pulse-error 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
};
