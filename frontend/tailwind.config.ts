import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        rebel: {
          red: "#DC2626",
          "red-dark": "#B91C1C",
          black: "#0A0A0A",
          sidebar: "#111111",
        },
      },
    },
  },
  plugins: [],
};

export default config;
