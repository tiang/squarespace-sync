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
          hover: '#1a1a1a',
        },
      },
      borderRadius: {
        card: '1rem',
      },
    },
  },
};
