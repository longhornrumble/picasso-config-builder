/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#047857', // MyRecruiter green
          light: '#10b981',
          dark: '#065f46',
          hover: '#065f46',
        },
      },
    },
  },
  plugins: [],
}
