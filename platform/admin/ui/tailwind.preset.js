/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'sans-serif'],
        heading: ['General Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#000000',
          muted: '#1a1a1a',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8fafc',
        },
      },
      borderRadius: {
        card: '1rem',
        pill: '9999px',
      },
    },
  },
};
