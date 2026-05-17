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
          navy:          "#16265a",
          "navy-dark":   "#1d3074",
          "navy-mid":    "#2e4496",
          "navy-light":  "#eef2ff",
          blue:          "#2453E4",
          "blue-dark":   "#1a44c4",
          "blue-50":     "#eef2ff",
          green:         "#2f8a4a",
          "green-dark":  "#1f6234",
          "green-light": "#ecf7ef",
          amber:         "#b6750a",
          "amber-50":    "#fbf3df",
          rose:          "#b53a4b",
          "rose-50":     "#fbecee",
        },
        surface: {
          DEFAULT: "#f6f6f3",
          card:    "#FFFFFF",
          alt:     "#f0efea",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
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
        card:     "0 1px 2px rgba(12,18,38,0.04), 0 1px 0 rgba(12,18,38,0.02)",
        "card-md": "0 4px 12px rgba(12,18,38,0.08), 0 1px 3px rgba(12,18,38,0.04)",
        modal:    "0 20px 60px rgba(12,18,38,0.12), 0 8px 24px rgba(12,18,38,0.06)",
        dropdown: "0 8px 24px rgba(12,18,38,0.10), 0 2px 6px rgba(12,18,38,0.06)",
        pop:      "0 10px 28px rgba(12,18,38,0.08), 0 2px 6px rgba(12,18,38,0.04)",
      },
      keyframes: {
        "fade-in":         { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up":        { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-right":  { from: { opacity: "0", transform: "translateX(16px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        "slide-in-bottom": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        "scale-in":        { from: { opacity: "0", transform: "scale(0.97)" }, to: { opacity: "1", transform: "scale(1)" } },
      },
      animation: {
        "fade-in":         "fade-in 200ms ease both",
        "slide-up":        "slide-up 220ms ease both",
        "slide-in-right":  "slide-in-right 200ms ease both",
        "slide-in-bottom": "slide-in-bottom 300ms cubic-bezier(0.32,0.72,0,1) both",
        "scale-in":        "scale-in 200ms ease both",
      },
    },
  },
  plugins: [],
};
