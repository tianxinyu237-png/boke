/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg))",
        "bg-soft": "rgb(var(--color-bg-soft))",
        "bg-mute": "rgb(var(--color-bg-mute))",
        surface: "rgb(var(--color-surface) / var(--color-surface-alpha))",
        "text-primary": "rgb(var(--color-text))",
        "text-secondary": "rgb(var(--color-text-secondary) / var(--color-text-secondary-alpha))",
        "text-muted": "rgb(var(--color-text-muted) / var(--color-text-muted-alpha))",
        accent: "rgb(var(--color-accent))",
        "accent-secondary": "rgb(var(--color-accent-secondary))",
        border: "rgb(var(--color-border) / var(--color-border-alpha))",
        "border-hover": "rgb(var(--color-border-hover) / var(--color-border-hover-alpha))",
      },
      fontFamily: {
        sans: ["var(--font-geist)", "-apple-system", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
