export interface FontConfig {
  sans: string;
}

export const FONT_OPTIONS = [
  { value: "inter", label: "Inter（默认）" },
  { value: "noto-sans-sc", label: "Noto Sans SC（思源黑体）" },
  { value: "lxgw-wenkai", label: "LXGW WenKai（霞鹜文楷）" },
  { value: "zcool-kuaile", label: "ZCOOL KuaiLe（站酷快乐体）" },
  { value: "ma-shan-zheng", label: "Ma Shan Zheng（马山正）" },
];

export const DEFAULT_FONT: FontConfig = {
  sans: "inter",
};

/** Map font key → next/font/google import name */
export const FONT_GOOGLE_MAP: Record<string, { family: string; cssVar: string }> = {
  inter:          { family: "Inter",           cssVar: "--font-sans" },
  "noto-sans-sc": { family: "Noto+Sans+SC",    cssVar: "--font-sans" },
  "lxgw-wenkai":  { family: "LXGW+WenKai",     cssVar: "--font-sans" },
  "zcool-kuaile": { family: "ZCOOL+KuaiLe",    cssVar: "--font-sans" },
  "ma-shan-zheng":{ family: "Ma+Shan+Zheng",   cssVar: "--font-sans" },
};

const STORAGE_KEY = "devlog-font-config";

export function loadFontConfig(): FontConfig {
  if (typeof window === "undefined") return DEFAULT_FONT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_FONT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_FONT;
}

export function saveFontConfig(config: FontConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
