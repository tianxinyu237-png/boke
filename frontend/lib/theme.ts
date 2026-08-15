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
  root.style.setProperty("--color-accent", mode.accent);
  root.style.setProperty("--color-accent-secondary", mode.accentSecondary);
  root.style.setProperty("--color-bg", mode.bg);
  root.style.setProperty("--color-bg-soft", mode.bgSoft);
  root.style.setProperty("--color-bg-mute", mode.bgMute);
  root.style.setProperty("--hero-from", mode.heroFrom);
  root.style.setProperty("--hero-via", mode.heroVia);
  root.style.setProperty("--hero-to", mode.heroTo);
}
