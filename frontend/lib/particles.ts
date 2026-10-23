export interface ParticleConfig {
  enabled: boolean;
  effect: string;
  cursorEffect: string;
  count: number;
  color: string;
  opacity: number;
  speed: number;
  enableMobile: boolean;
  pageMode: "all" | "include" | "exclude";
  includePaths: string;
  excludePaths: string;
  cursorStyleEnabled: boolean;
  cursorStyleTemplate: string;
  cursorStyleImage: string;
  zIndex: number;
}

export const EFFECTS = [
  { value: "none", label: "关闭" },
  { value: "snow", label: "❄️ 雪花飘落" },
  { value: "stars", label: "✨ 星空漂浮" },
  { value: "bubbles", label: "🫧 气泡上升" },
  { value: "fireflies", label: "🌟 萤火闪烁" },
  { value: "sakura", label: "🌸 樱花飘落" },
  { value: "ripple", label: "🌊 水波涟漪" },
  { value: "meteors", label: "🌠 流星雨" },
  { value: "leaves", label: "🍂 落叶飘落" },
  { value: "network", label: "🕸️ 粒子连线" },
  { value: "stardust", label: "🌌 星尘漂浮" },
  { value: "confetti", label: "🎉 彩纸飘落" },
  { value: "rain", label: "🌧️ 细雨" },
  { value: "dandelion", label: "🌾 蒲公英飘散" },
  { value: "feathers", label: "🪶 羽毛飘落" },
  { value: "aurora", label: "🔮 极光流动" },
  { value: "constellations", label: "🔯 星座连线" },
  { value: "notes", label: "🎵 漂浮音符" },
  { value: "lightspots", label: "🔆 光斑漂浮" },
  { value: "firefly-cluster", label: "🪰 萤火虫聚散" },
];

export const CURSOR_EFFECTS = [
  { value: "none", label: "关闭" },
  { value: "fireworks", label: "🎆 点击礼花" },
  { value: "ripple", label: "🌊 水波涟漪" },
  { value: "trail", label: "✨ 拖尾光点" },
  { value: "stars", label: "⭐ 跟随小星星" },
  { value: "preset-stars", label: "🌟 光标星星跟随" },
  { value: "hearts", label: "❤️ 点击爱心" },
  { value: "halo", label: "⭕ 鼠标光环" },
  { value: "webgl-tail", label: "💫 WebGL 光标尾巴" },
  { value: "click-bubbles", label: "🫧 点击气泡" },
  { value: "click-flowers", label: "🌸 点击小花" },
  { value: "rainbow-trail", label: "🌈 鼠标彩虹拖尾" },
  { value: "magnet", label: "🧲 鼠标磁吸粒子" },
];

export const CURSOR_TEMPLATES = [
  { value: "bocchi-gotou", label: "🎸 后藤独" },
  { value: "bocchi-nijika", label: "🎸 伊地知虹夏" },
  { value: "bocchi-ryo", label: "🎸 山田凉" },
  { value: "miku", label: "🎤 Miku" },
  { value: "miku-blz", label: "🎤 Miku BLZ" },
  { value: "luo-tianyi", label: "🎤 洛天依" },
  { value: "anya", label: "🥜 阿尼亚" },
  { value: "rem", label: "💙 蕾姆" },
  { value: "nyanko", label: "🐱 猫咪老师" },
  { value: "pink-pig", label: "🐷 粉色小猪" },
  { value: "kuroko-tetsuya", label: "🏀 黑子哲也" },
  { value: "luo-xiaohei", label: "🐾 罗小黑" },
  { value: "firefly", label: "✨ 流荧" },
];

export const DEFAULT_CONFIG: ParticleConfig = {
  enabled: true,
  effect: "stardust",
  cursorEffect: "halo",
  count: 80,
  color: "#7DCDE8",
  opacity: 0.5,
  speed: 1.0,
  enableMobile: false,
  pageMode: "all",
  includePaths: "",
  excludePaths: "",
  cursorStyleEnabled: false,
  cursorStyleTemplate: "bocchi-gotou",
  cursorStyleImage: "",
  zIndex: 2147483000,
};

const STORAGE_KEY = "devlog-particle-config";
const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "/api")
  : "/api";

/** 类型防护: 合并默认值前校验字段类型, 防止旧格式/损坏的 localStorage 数据导致 .split() 崩溃 */
function normalizeConfig(parsed: Partial<ParticleConfig>): ParticleConfig {
  const merged: ParticleConfig = { ...DEFAULT_CONFIG, ...parsed };
  if (typeof merged.includePaths !== "string") merged.includePaths = "";
  if (typeof merged.excludePaths !== "string") merged.excludePaths = "";
  if (typeof merged.effect !== "string") merged.effect = DEFAULT_CONFIG.effect;
  if (typeof merged.cursorEffect !== "string") merged.cursorEffect = DEFAULT_CONFIG.cursorEffect;
  if (typeof merged.cursorStyleTemplate !== "string") merged.cursorStyleTemplate = DEFAULT_CONFIG.cursorStyleTemplate;
  if (typeof merged.color !== "string" || !merged.color.startsWith("#")) merged.color = DEFAULT_CONFIG.color;
  if (typeof merged.pageMode !== "string" || !["all", "include", "exclude"].includes(merged.pageMode)) {
    merged.pageMode = DEFAULT_CONFIG.pageMode;
  }
  if (typeof merged.count !== "number" || Number.isNaN(merged.count)) merged.count = DEFAULT_CONFIG.count;
  if (typeof merged.opacity !== "number" || Number.isNaN(merged.opacity)) merged.opacity = DEFAULT_CONFIG.opacity;
  if (typeof merged.speed !== "number" || Number.isNaN(merged.speed)) merged.speed = DEFAULT_CONFIG.speed;
  if (typeof merged.zIndex !== "number" || Number.isNaN(merged.zIndex)) merged.zIndex = DEFAULT_CONFIG.zIndex;
  if (typeof merged.enabled !== "boolean") merged.enabled = DEFAULT_CONFIG.enabled;
  if (typeof merged.enableMobile !== "boolean") merged.enableMobile = DEFAULT_CONFIG.enableMobile;
  if (typeof merged.cursorStyleEnabled !== "boolean") merged.cursorStyleEnabled = DEFAULT_CONFIG.cursorStyleEnabled;
  if (typeof merged.cursorStyleImage !== "string") merged.cursorStyleImage = "";
  return merged;
}

export function loadConfig(): ParticleConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeConfig(JSON.parse(raw));
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveConfig(config: ParticleConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/** 从服务器加载粒子配置(跨设备持久化) */
export async function loadParticleConfigFromServer(): Promise<ParticleConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/site-config`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.particleConfig) {
      const parsed = typeof data.particleConfig === "string"
        ? JSON.parse(data.particleConfig)
        : data.particleConfig;
      if (parsed && typeof parsed === "object") return normalizeConfig(parsed);
    }
  } catch {}
  return null;
}

/** 保存粒子配置到服务器(需要 admin token) */
export async function saveParticleConfigToServer(config: ParticleConfig): Promise<boolean> {
  try {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`${API_BASE}/site-config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Api-Key": token } : {}),
      },
      body: JSON.stringify({ particleConfig: JSON.stringify(config) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
