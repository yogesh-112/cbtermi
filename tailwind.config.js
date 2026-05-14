/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:          "#1B3A5C",
          "navy-dark":   "#0F2235",
          "navy-mid":    "#24507E",
          green:         "#16A34A",
          "green-dark":  "#0F7238",
          "green-light": "#22C55E",
        },
      },
    },
  },
  plugins: [],
};
