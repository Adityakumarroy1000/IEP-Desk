/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#EFF6FF"
        },
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
        gray50: "#F9FAFB",
        gray100: "#F3F4F6",
        gray800: "#1F2937"
      }
    }
  },
  plugins: []
};
