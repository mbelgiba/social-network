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
        obsidian: "#0a0a0a",
        crimson: {
          DEFAULT: "#e11d48",
          glow: "rgba(225, 29, 72, 0.15)",
        }
      },
      boxShadow: {
        'crimson-glow': '0 0 20px rgba(225, 29, 72, 0.2)',
        'crimson-bold': '0 0 40px rgba(225, 29, 72, 0.4)',
      }
    },
  },
  plugins: [],
};
export default config;