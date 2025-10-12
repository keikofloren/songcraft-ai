/** @type{import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        brown: {
          50: "#f9f6f3",
          100: "#f2e9e1",
          200: "#e5d3c3",
          300: "#d6bfa6",
          400: "#b89c7a",
          500: "#9a7a4e",
          600: "#7c5e3a",
          700: "#5e4327",
          800: "#3f2914",
          900: "#211102",
        },
      },
    },
  },
  plugins: [],
};
