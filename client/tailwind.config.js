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
        fbBlack: 'hsl(230, 20%, 10%)',
        fbWhite: 'hsl(180, 10%, 80%)',
        fbHover: 'hsl(230, 15%, 20%)',
        accent: 'hsl(160, 100%, 40%)',
        destructive: 'hsl(350, 100%, 50%)',
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
          '0%, 100%': { '@apply bg-green-900/20 border-green-500/50': {} },
          '50%': { '@apply bg-green-500/20 border-green-500/50': {} },
        },
      },
      animation: {
        pulse: 'pulse 1s infinite',
      },
    },
  },
};
