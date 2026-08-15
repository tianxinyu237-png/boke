export interface BackgroundConfig {
  enabled: boolean;
  type: "image" | "video";
  url: string;
  opacity: number;
  blur: number;
  enableMobile: boolean;
  welcomeEnabled: boolean;
  welcomeType: "image" | "video";
  welcomeUrl: string;
}

export const DEFAULT_BG: BackgroundConfig = {
  enabled: false,
  type: "image",
  url: "",
  opacity: 0.15,
  blur: 0,
  enableMobile: false,
  welcomeEnabled: false,
  welcomeType: "image",
  welcomeUrl: "",
};

const STORAGE_KEY = "devlog-background-config";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export function loadBgConfig(): BackgroundConfig {
  if (typeof window === "undefined") return DEFAULT_BG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_BG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_BG;
}

export function saveBgConfig(config: BackgroundConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/** Load background config from server (returns null if not found) */
export async function loadBgConfigFromServer(): Promise<BackgroundConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/site-config`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.backgroundConfig) {
      const parsed = typeof data.backgroundConfig === "string"
        ? JSON.parse(data.backgroundConfig)
        : data.backgroundConfig;
      return { ...DEFAULT_BG, ...parsed };
    }
  } catch {}
  return null;
}

/** Save background config to server (requires admin token) */
export async function saveBgConfigToServer(config: BackgroundConfig): Promise<boolean> {
  try {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`${API_BASE}/site-config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Api-Key": token } : {}),
      },
      body: JSON.stringify({ backgroundConfig: JSON.stringify(config) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Hybrid: load from server, fallback to localStorage, update localStorage from server */
export async function loadBgConfigHybrid(): Promise<BackgroundConfig> {
  // Try server first
  const serverCfg = await loadBgConfigFromServer();
  if (serverCfg) {
    // Update localStorage cache
    saveBgConfig(serverCfg);
    return serverCfg;
  }
  // Fallback to localStorage
  return loadBgConfig();
}
