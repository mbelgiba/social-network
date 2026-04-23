import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--bg-primary)",
        secondary: "var(--bg-secondary)",
        accent: "var(--bg-accent)",
        yellow: {
          DEFAULT: "var(--color-yellow)",
          dark: "var(--color-yellow-dark)",
          bright: "var(--color-yellow-bright)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        },
        border: {
          DEFAULT: "var(--border-color)",
          accent: "var(--border-accent)",
        }
      },
      boxShadow: {
        glow: "var(--glow)",
      }
    },
  },
  plugins: [],
};
export default config;