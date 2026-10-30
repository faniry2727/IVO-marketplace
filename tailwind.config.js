/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ketrika: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#bcdcff',
          300: '#8ec6ff',
          400: '#59a6ff',
          500: '#3380fc',
          600: 'var(--theme-primary, #1d60f2)',
          700: 'var(--theme-secondary, #164ae0)',
          800: '#193db5',
          900: '#1a378f',
          950: '#142357',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: 'var(--theme-accent, #f97316)',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      fontFamily: {
        sans: ['var(--theme-font-body, Inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--theme-font-heading, Inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
