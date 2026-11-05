/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'cafe-brown': '#6B3A2A',
        'cafe-brown-light': '#8B4A36',
        'cafe-cream': '#FDF6EC',
        'cafe-green': '#2D5016',
        'cafe-gold': '#C9A84C',
        'cafe-light': '#F5E6D3',
        'cafe-dark': '#1A0F0A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
