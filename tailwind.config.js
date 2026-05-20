/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        luxury: {
          dark: "#0f0f0f",
          gold: "#d4af37",
          silver: "#c0c0c0",
          cream: "#f5f1e8",
          charcoal: "#2a2a2a",
          danger: "#ff4d4d",
        },
      },
      fontFamily: {
        luxury: ["Playfair Display", "serif"],
        body: ["Lato", "sans-serif"],
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};
