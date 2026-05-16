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
          navy:          "#123B5D",
          "navy-dark":   "#0c2a44",
          "navy-mid":    "#1a4f7a",
          green:         "#3FA66B",
          "green-dark":  "#2d8a55",
          "green-light": "#5cbc83",
        },
        surface: {
          DEFAULT: "#F5F7FA",
          card:    "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
