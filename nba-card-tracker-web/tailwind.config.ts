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
        card: "0 2px 10px rgba(0,0,0,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
