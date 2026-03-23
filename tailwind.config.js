/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1B3A6B',
          50: '#EEF2F9',
          100: '#D4E0F0',
          200: '#A9C1E1',
          300: '#7EA2D2',
          400: '#5383C3',
          500: '#2864B4',
          600: '#1B3A6B',
          700: '#142D53',
          800: '#0E1F3B',
          900: '#071223',
        },
        gold: {
          DEFAULT: '#D4A843',
          50: '#FDF6E7',
          100: '#FAEDC9',
          200: '#F5DB93',
          300: '#EFC95D',
          400: '#D4A843',
          500: '#B8882A',
          600: '#8F6920',
          700: '#664A17',
          800: '#3D2C0E',
          900: '#140E05',
        },
        champagne: '#F5F0E8',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'slide-in-left':  'slide-in-left 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
