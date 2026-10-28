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
        // 全站正文统一为霞鹜文楷（SIL OFL 1.1，自托管 97 片 woff2 按需加载）。
        // 它含完整西文字形，所以英文/数字也走同一套，不再回退 Inter。
        // 注意：≤12px 的辅助文字用楷体会发虚，globals.css 里给这类小字
        // 单独回退无衬线（.text-[9px]~.text-[12px] 的 muted 文本）。
        sans: [
          "LXGW WenKai Lite",
          "Songti SC",
          "Georgia",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
        // 等宽只留给代码和需要数字对齐的地方（代码块、行号、日期列），
        // 代码用楷体没法看，这一层不动。
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
