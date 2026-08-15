export interface Friend {
  name: string;
  url: string;
  desc: string;
  avatar?: string;
}

export interface LinksConfig {
  friends: Friend[];
  exchangeName: string;
  exchangeDesc: string;
}

export const DEFAULT_LINKS: LinksConfig = {
  friends: [
    { name: "Wangxinyang", url: "https://wangxinyang.top", desc: "智能制造 / AI学习 / LaTeX写作" },
  ],
  exchangeName: "田",
  exchangeDesc: "关于代码、系统和工程的深度思考",
};

const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "/api")
  : "/api";

export async function loadLinksConfig(): Promise<LinksConfig> {
  try {
    const res = await fetch(`${API_BASE}/site-config`);
    if (!res.ok) return DEFAULT_LINKS;
    const data = await res.json();
    if (data.linksConfig) {
      const parsed = typeof data.linksConfig === "string"
        ? JSON.parse(data.linksConfig)
        : data.linksConfig;
      return { ...DEFAULT_LINKS, ...parsed };
    }
  } catch {}
  return DEFAULT_LINKS;
}

export async function saveLinksConfig(config: LinksConfig): Promise<boolean> {
  try {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`${API_BASE}/site-config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Api-Key": token } : {}),
      },
      body: JSON.stringify({ linksConfig: JSON.stringify(config) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
