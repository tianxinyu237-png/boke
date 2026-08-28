export interface ThemeColors {
  dark: {
    accent: string;
    accentSecondary: string;
    bg: string;
    bgSoft: string;
    bgMute: string;
    heroFrom: string;
    heroVia: string;
    heroTo: string;
  };
  light: {
    accent: string;
    accentSecondary: string;
    bg: string;
    bgSoft: string;
    bgMute: string;
    heroFrom: string;
    heroVia: string;
    heroTo: string;
  };
}

export const DEFAULT_THEME: ThemeColors = {
  dark: {
    accent: "192 132 252",
    accentSecondary: "167 139 250",
    bg: "27 27 34",
    bgSoft: "36 36 48",
    bgMute: "44 44 54",
    heroFrom: "#7DCDE8",
    heroVia: "#c084fc",
    heroTo: "#f093fb",
  },
  light: {
    accent: "14 165 233",
    accentSecondary: "56 189 248",
    bg: "245 245 245",
    bgSoft: "239 239 239",
    bgMute: "232 232 232",
    heroFrom: "#0ea5e9",
    heroVia: "#22d3ee",
    heroTo: "#38bdf8",
  },
};

const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "/api")
  : "/api";

/**
 * 颜色值归一化: hex(#rgb/#rrggbb) → "r g b" triplet。
 * globals.css/tailwind 全部用 rgb(var(--color-accent)) 形式消费 accent/bg 系列变量,
 * 后台配置里若存 hex 会导致 rgb(var(...)) 无效(主题色失效)。triplet 原样保留。
 * 注意: hero 渐变变量(heroFrom/via/to)直接作为颜色值使用, 不进本函数。
 */
export function normalizeColorValue(v: string): string {
  const t = (v || "").trim();
  const m = t.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let hex = m[1];
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
  }
  if (/^\d{1,3}(\s+\d{1,3}){2}$/.test(t)) return t.replace(/\s+/g, " ");
  return t; // rgba()/其他格式原样
}

/** 生成 SSR 首帧主题 CSS: html:root(暗) + html.light(亮), 特异性高于 globals.css 的 :root/.light */
export function buildThemeCss(theme: ThemeColors): string {
  const block = (m: ThemeColors["dark"], sel: string) =>
    `${sel}{` +
    `--color-accent:${normalizeColorValue(m.accent)};` +
    `--color-accent-secondary:${normalizeColorValue(m.accentSecondary)};` +
    `--color-bg:${normalizeColorValue(m.bg)};` +
    `--color-bg-soft:${normalizeColorValue(m.bgSoft)};` +
    `--color-bg-mute:${normalizeColorValue(m.bgMute)};` +
    `--hero-from:${m.heroFrom};` +
    `--hero-via:${m.heroVia};` +
    `--hero-to:${m.heroTo};` +
    `}`;
  return block(theme.dark, "html:root") + block(theme.light, "html.light");
}

export async function loadThemeConfig(): Promise<ThemeColors> {
  try {
    const res = await fetch(`${API_BASE}/site-config`);
    if (!res.ok) return DEFAULT_THEME;
    const data = await res.json();
    if (data.themeConfig) {
      const parsed = typeof data.themeConfig === "string"
        ? JSON.parse(data.themeConfig)
        : data.themeConfig;
      return { ...DEFAULT_THEME, ...parsed, dark: { ...DEFAULT_THEME.dark, ...(parsed.dark || {}) }, light: { ...DEFAULT_THEME.light, ...(parsed.light || {}) } };
    }
  } catch {}
  return DEFAULT_THEME;
}

export async function saveThemeConfig(config: ThemeColors): Promise<boolean> {
  try {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`${API_BASE}/site-config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Api-Key": token } : {}),
      },
      body: JSON.stringify({ themeConfig: JSON.stringify(config) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Apply theme colors to CSS variables on <html> */
export function applyTheme(theme: ThemeColors, isLight: boolean) {
  if (typeof document === "undefined") return;
  const mode = isLight ? theme.light : theme.dark;
  const root = document.documentElement;
  root.style.setProperty("--color-accent", normalizeColorValue(mode.accent));
  root.style.setProperty("--color-accent-secondary", normalizeColorValue(mode.accentSecondary));
  root.style.setProperty("--color-bg", normalizeColorValue(mode.bg));
  root.style.setProperty("--color-bg-soft", normalizeColorValue(mode.bgSoft));
  root.style.setProperty("--color-bg-mute", normalizeColorValue(mode.bgMute));
  root.style.setProperty("--hero-from", mode.heroFrom);
  root.style.setProperty("--hero-via", mode.heroVia);
  root.style.setProperty("--hero-to", mode.heroTo);
}
