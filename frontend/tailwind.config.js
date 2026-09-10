/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: {
          50: '#f6f6f5',
          100: '#e7e7e5',
          200: '#cfcfcc',
          300: '#a8a8a3',
          400: '#787872',
          500: '#54544e',
          600: '#3d3d38',
          700: '#2a2a26',
          800: '#191917',
          900: '#0c0c0b'
        }
      }
    }
  },
  plugins: []
}
