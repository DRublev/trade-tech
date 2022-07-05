/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/**/*.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  corePlugins: {
    fontSmoothing: 'antialiased',
  },
  theme: {
    extend: {
      colors: {
        purple: {
          100: '#b4b4d6',
          200: '#a4a4cd',
          300: '#9595c5',
          400: '#8686bd',
          500: '#6868AC',
          600: '#7777b4',
          700: '#5e5e9b',
          800: '#53538a',
          900: '#494978',
        }
      },
    },
    minHeight: {
      '0': '0',
      '1/4': '25%',
      '1/2': '50%',
      '3/4': '75%',
      'full': '100%',
    }
  },
  plugins: [],
}
