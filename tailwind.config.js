/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          app: "#12141a",
          panel: "rgba(22, 26, 35, 0.9)",
          card: "rgba(28, 33, 44, 0.8)",
          input: "rgba(16, 19, 26, 0.9)",
          tooltip: "#222836",
          overlay: "rgba(8, 10, 14, 0.85)",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.07)",
          default: "rgba(255, 255, 255, 0.12)",
          focus: "rgba(245, 158, 11, 0.5)",
          accent: "rgba(245, 158, 11, 0.8)",
          glow: "rgba(245, 158, 11, 0.2)",
        },
        text: {
          primary: "#f8fafc",
          secondary: "#cbd5e1",
          muted: "#94a3b8",
          accent: "#fbbf24",
          on_accent: "#1c1404",
        },
        accent: {
          primary: "#f59e0b",
          primary_hover: "#d97706",
          secondary: "#10b981",
          secondary_hover: "#059669",
          success: "#10b981",
          warning: "#fbbf24",
          danger: "#f43f5e",
        },
      },
      fontFamily: {
        sans: ["'Zen Kaku Gothic New'", "'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      boxShadow: {
        studio: "0 12px 36px 0 rgba(0, 0, 0, 0.45)",
        glowAmber: "0 0 20px rgba(245, 158, 11, 0.25)",
        glowEmerald: "0 0 20px rgba(16, 185, 129, 0.25)",
      },
    },
  },
  plugins: [],
}
