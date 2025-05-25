/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
  experimental: {
    // Drop unused base styles for smaller CSS output
    optimizeUniversalDefaults: true,
  },
};
