import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        omnidim: {
          bg: "#04080a",
          dark: "#020507",
          surface: "#070e12",
          card: "#091318",
          cardHover: "#0d1b22",
          border: "#142832",
          borderHover: "#1f3e4e",
          teal: "#00b3b3",
          cyan: "#00e5cc",
          neon: "#0df2c9",
          mint: "#a7f3d0",
        },
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        primary: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
        },
        accent: {
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
          cyan: "#00e5cc",
          teal: "#00b3b3",
          violet: "#8b5cf6",
        },
      },
      boxShadow: {
        "omni-glow": "0 0 25px rgba(0, 229, 204, 0.25)",
        "omni-glow-sm": "0 0 12px rgba(0, 229, 204, 0.2)",
        "omni-glow-lg": "0 0 45px rgba(0, 229, 204, 0.35)",
        "omni-card": "0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(20, 40, 50, 0.8)",
      },
      backgroundImage: {
        "omni-radial": "radial-gradient(circle at 50% 0%, rgba(0, 229, 204, 0.12) 0%, transparent 60%)",
        "omni-glow-grad": "radial-gradient(ellipse at top, rgba(0, 179, 179, 0.15), transparent 70%)",
      },
    },
  },
  plugins: [],
};

export default config;
