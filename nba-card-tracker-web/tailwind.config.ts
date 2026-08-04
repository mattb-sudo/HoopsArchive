import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.10), 0 10px 22px -8px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)",
        "card-hover": "0 2px 4px rgba(0,0,0,0.14), 0 16px 30px -8px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
