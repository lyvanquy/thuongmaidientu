/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e8f0fe',
          100: '#c6d8fd',
          200: '#a0bcfb',
          300: '#769ff8',
          400: '#5786f5',
          500: '#3a6df0',
          600: '#1a4fd6',
          700: '#0a2463', // main brand
          800: '#071a4a',
          900: '#040f2d',
        },
        accent: {
          50:  '#fff4eb',
          100: '#ffe2c8',
          200: '#ffc99a',
          300: '#f4a261', // main accent/orange
          400: '#e8853a',
          500: '#d4681a',
          600: '#b35210',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#0f172a',
          card: '#f8fafc',
          'card-dark': '#1e293b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};
