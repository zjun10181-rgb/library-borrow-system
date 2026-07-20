/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#fff7f2',
          100: '#ffede2',
          200: '#f5d8c4',
          300: '#e8b894',
          400: '#d49063',
          500: '#b8562f',
          600: '#a04a29',
          700: '#803b23',
          800: '#663120',
          900: '#542a1e',
        },
        secondary: {
          50: '#f0f7f1',
          100: '#dcebe1',
          200: '#bbd9c4',
          300: '#90bf9e',
          400: '#679f7a',
          500: '#5a7c5e',
          600: '#4a6650',
          700: '#3e5344',
          800: '#36453a',
          900: '#2f3a32',
        },
        ink: '#2c2418',
        cream: '#fdf8f3',
        divider: '#e0d5c8',
        muted: '#8a7d6f',
      },
      fontFamily: {
        sans: ['Instrument Sans', 'sans-serif'],
        serif: ['Crimson Pro', 'serif'],
      },
    },
  },
  plugins: [],
};