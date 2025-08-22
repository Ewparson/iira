/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // wrap <html> or <body> in `class="dark"`
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000', // pure black
        surface:    '#1A1A1A', // charcoal
        primary:    '#E53E3E', // red-600 style
        text:       '#F7FAFC', // near-white
      },
      fontFamily: {
        brand: ['Montserrat', 'sans-serif'],  // or Orbitron, Titillium Web…
      },
    },
  },
  plugins: [],
};
