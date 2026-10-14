/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#F0F6FF',
          100: '#E0EDFF',
          200: '#C2DCFF',
          300: '#94C3FF',
          400: '#5BA0FF',
          500: '#2F7CFF',
          600: '#0066FF',
          700: '#0052CC',
          800: '#0040A1',
          900: '#002B6D',
        },
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        card: '0 2px 12px -2px rgba(16, 24, 40, 0.06)',
      },
    },
  },
  plugins: [],
};
