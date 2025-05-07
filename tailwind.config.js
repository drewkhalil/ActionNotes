/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Change to 'class' to disable system-based dark mode
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',
        secondary: '#E5E7EB',
        background: '#FFFFFF',
        text: '#4B5563',
      },
    },
  },
  plugins: [],
}