/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",  // Primary Matrimonial Rose Crimson
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
          950: "#4c0519",
        },
        gold: {
          50: "#fdfbf7",
          100: "#faf4e8",
          200: "#f4e6ca",
          300: "#edd2a3",
          400: "#e3b86e",
          500: "#d99e3f",  // Gold Accent for Premium Highlights
          600: "#c38231",
          700: "#9e6126",
          800: "#804e24",
          900: "#694020",
        }
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["'Playfair Display'", "Georgia", "serif"],
        royal: ["'Cinzel'", "Georgia", "serif"],
      }
    },
  },
  plugins: [],
};
