import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        apple: {
          text: "rgb(var(--apple-text) / <alpha-value>)",
          secondary: "rgb(var(--apple-secondary) / <alpha-value>)",
          bg: "rgb(var(--apple-bg) / <alpha-value>)",
          blue: "#0071e3",
          "blue-hover": "#0077ed",
          card: "rgb(var(--apple-card) / <alpha-value>)",
          border: "rgb(var(--apple-border) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        apple: "16px",
        "apple-sm": "8px",
        "apple-lg": "24px",
      },
      boxShadow: {
        apple: "0 2px 10px rgba(0,0,0,0.04)",
        "apple-lg": "0 4px 24px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
