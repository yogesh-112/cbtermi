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
          "navy-light":  "#EEF4FA",
          green:         "#3FA66B",
          "green-dark":  "#2d8a55",
          "green-light": "#ECFDF5",
        },
        surface: {
          DEFAULT: "#F6F8FB",
          card:    "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        btn:   "10px",
        input: "10px",
        card:  "16px",
        modal: "20px",
        xl2:   "20px",
        xl3:   "24px",
      },
      boxShadow: {
        card:  "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        "card-md": "0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
        modal: "0 20px 60px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)",
        dropdown: "0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
      },
      keyframes: {
        "fade-in":  { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-right": { from: { opacity: "0", transform: "translateX(16px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        "slide-in-bottom": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.97)" }, to: { opacity: "1", transform: "scale(1)" } },
      },
      animation: {
        "fade-in":  "fade-in 200ms ease both",
        "slide-up": "slide-up 220ms ease both",
        "slide-in-right": "slide-in-right 200ms ease both",
        "slide-in-bottom": "slide-in-bottom 300ms cubic-bezier(0.32,0.72,0,1) both",
        "scale-in": "scale-in 200ms ease both",
      },
    },
  },
  plugins: [],
};
