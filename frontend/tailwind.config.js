/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#6E56CF",
          dark: "#4C3A9E",
          tint: "#EDE9FE",
        },
        ink: "#1F2430",
        slate: "#5B6472",
        line: "#DCDFE5",
        success: "#1E8E5A",
        warning: "#B7791F",
        danger: "#D64545",
        surface: "#F7F7FB",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(31,36,48,0.04), 0 4px 16px rgba(31,36,48,0.06)",
      },
    },
  },
  plugins: [],
};
