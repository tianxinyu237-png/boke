export interface SiteConfig {
  name: string;
  description: string;
  tagline: string;
  avatar: string;
  avatarUrl: string;
  founded: string;
  keywords: string;
  defaultCoverImage: string;
  giscusRepo: string;
  giscusRepoId: string;
  giscusCategory: string;
  giscusCategoryId: string;
  live2dModelPath: string;
}

export const DEFAULT_SITE: SiteConfig = {
  name: "田",
  description: "关于代码、系统和工程的深度思考",
  tagline: "没有快餐内容 — 只有认真研究的写作。",
  avatar: "田",
  avatarUrl: "",
  founded: "2026-03-20",
  keywords: "博客,技术,编程,开发,全栈",
  defaultCoverImage: "",
  giscusRepo: "",
  giscusRepoId: "",
  giscusCategory: "Announcements",
  giscusCategoryId: "",
  live2dModelPath: "hijiki/hijiki.model.json",
};

const STORAGE_KEY = "devlog-site-config";
const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "/api")
  : "/api";

/** Load from localStorage (fast, always available) */
export function loadSiteConfig(): SiteConfig {
  if (typeof window === "undefined") return DEFAULT_SITE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SITE, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SITE;
}

export function saveSiteConfig(config: SiteConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/** Load site config from server */
export async function loadSiteConfigFromServer(): Promise<SiteConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/site-config`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.siteConfig) {
      const parsed = typeof data.siteConfig === "string"
        ? JSON.parse(data.siteConfig)
        : data.siteConfig;
      return { ...DEFAULT_SITE, ...parsed };
    }
  } catch {}
  return null;
}

/** Save site config to server (requires admin token) */
export async function saveSiteConfigToServer(config: SiteConfig): Promise<boolean> {
  try {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`${API_BASE}/site-config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Api-Key": token } : {}),
      },
      body: JSON.stringify({ siteConfig: JSON.stringify(config) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Hybrid: server first, localStorage fallback, cache server result */
export async function loadSiteConfigHybrid(): Promise<SiteConfig> {
  const serverCfg = await loadSiteConfigFromServer();
  if (serverCfg) {
    saveSiteConfig(serverCfg);
    return serverCfg;
  }
  return loadSiteConfig();
}
