const animate = require('tailwindcss-animate');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{ts,tsx,vue}',
    './components/**/*.{ts,tsx,vue}',
    './app/**/*.{ts,tsx,vue}',
    './src/**/*.{ts,tsx,vue}',
  ],
  theme: {
    fontFamily: {
      sans: ['"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
    },
    extend: {
      colors: {
        background: 'hsl(220, 30%, 10%)',
        foreground: 'hsl(151, 36%, 90%)',
        muted: 'hsl(220, 20%, 20%)',
        mutedForeground: 'hsl(151, 25%, 70%)',
        accent: 'hsl(120, 80%, 50%)',
        destructive: 'hsl(0, 100%, 50%)',
        destructiveForeground: 'hsl(0, 0%, 100%)',
        success: 'hsl(120, 100%, 40%)',
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
    }
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        '.btn': {
          padding: '0.5rem 1rem',
          fontWeight: '400',
          borderRadius: '0.375rem',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          transition: 'all 0.4s ease',
          '&:hover': {
            opacity: '75%'
          }
        },
        '.btn-primary': {
          backgroundColor: 'hsl(220, 98%, 61%)',
          color: '#fff',
          '&:hover': {
            backgroundColor: 'hsl(220, 98%, 50%)',
          },
        },
        '.btn-secondary': {
          backgroundColor: 'hsl(198, 60%, 50%)',
          color: '#fff',
          '&:hover': {
            backgroundColor: 'hsl(198, 60%, 40%)',
          },
        },
        '.btn-destructive': {
          backgroundColor: 'hsl(0, 100%, 50%)',
          color: '#fff',
          '&:hover': {
            backgroundColor: 'hsl(198, 60%, 40%)',
          },
        },
      });
    },
  ],
}
