const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        compare: colors.amber,
        move: colors.indigo,
        found: colors.green,
        error: colors.red,
      },
      borderRadius: {
        panel: '0.75rem',
        control: '0.375rem',
        pill: '9999px',
      },
      transitionDuration: {
        fast: '150',
        base: '200',
        slow: '300',
      },
      transitionTimingFunction: {
        'soft-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
