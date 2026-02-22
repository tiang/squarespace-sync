import preset from './ui/tailwind.preset.js';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    './ui/src/**/*.{js,jsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
