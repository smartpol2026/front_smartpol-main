/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        surface: {
          DEFAULT: "#F4F7FE",
          muted: "#EEF2F8",
          card: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#111827",
          soft: "#4B5563",
          muted: "#9CA3AF",
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: ["Courier New", "Courier", "monospace"],
      },
      boxShadow: {
        soft: "0 2px 12px rgba(27, 37, 89, 0.06)",
        card: "0 4px 18px rgba(27, 37, 89, 0.07)",
        "card-hover": "0 10px 28px rgba(27, 37, 89, 0.10)",
        sidebar: "4px 0 24px rgba(249, 115, 22, 0.18)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
