/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#373d20',    // Dark green
          DEFAULT: '#717744', // Medium green
          light: '#abac7f',   // Light green/olive
        },
        background: '#fefefe', // White
        text: '#080808',       // Black
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}