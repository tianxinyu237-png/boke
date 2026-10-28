/* ══════════════════════════════════════════════════════════════
   友链配置（2026-10-28 扩展）

   改动背景：原来只有 friends + exchangeName + exchangeDesc 三个字段，
   友链页的标题、副标题、交换说明全写死在组件里，改不了；
   而且数据库里存的是旧结构 exchangeInfo:{name,url,description}，
   和这里的 exchangeName/exchangeDesc 对不上，两边各说各话。

   现在统一成一套扁平字段，后台表单可以直接编辑全部内容。
   ══════════════════════════════════════════════════════════════ */

export interface Friend {
  name: string;
  url: string;
  desc: string;
  avatar?: string;
}

export interface LinksConfig {
  /* ── 页面文案 ── */
  pageTitle: string;        // 大标题
  pageSubtitle: string;     // 标题下方一句说明
  /* ── 友链列表 ── */
  friends: Friend[];
  /* ── 本站信息（给别人抄的）── */
  exchangeName: string;
  exchangeUrl: string;
  exchangeDesc: string;
  exchangeAvatar: string;
  /* ── 交换说明 ── */
  exchangeNote: string;
}

export const DEFAULT_LINKS: LinksConfig = {
  pageTitle: "从一扇窗，走到另一扇窗",
  pageSubtitle: "常去的技术博客和朋友们的小站",
  friends: [],
  exchangeName: "田",
  exchangeUrl: "",
  exchangeDesc: "关于代码、系统和工程的深度思考",
  exchangeAvatar: "",
  exchangeNote: "欢迎交换友链。请先在您的博客添加本站链接，然后通过评论区或 GitHub Issue 通知我。",
};

const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "/api")
  : "/api";

/** 把数据库里的各种历史结构都归一成 LinksConfig */
function normalize(raw: any): LinksConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_LINKS;

  // 旧结构的交换信息是个对象
  const info = raw.exchangeInfo || {};

  return {
    pageTitle: raw.pageTitle ?? DEFAULT_LINKS.pageTitle,
    pageSubtitle: raw.pageSubtitle ?? DEFAULT_LINKS.pageSubtitle,
    friends: Array.isArray(raw.friends) ? raw.friends : [],
    exchangeName: raw.exchangeName ?? info.name ?? DEFAULT_LINKS.exchangeName,
    exchangeUrl: raw.exchangeUrl ?? info.url ?? "",
    exchangeDesc: raw.exchangeDesc ?? info.description ?? DEFAULT_LINKS.exchangeDesc,
    exchangeAvatar: raw.exchangeAvatar ?? info.avatar ?? "",
    exchangeNote: raw.exchangeNote ?? DEFAULT_LINKS.exchangeNote,
  };
}

export async function loadLinksConfig(): Promise<LinksConfig> {
  try {
    const res = await fetch(`${API_BASE}/site-config`);
    if (!res.ok) return DEFAULT_LINKS;
    const data = await res.json();
    if (data.linksConfig) {
      const parsed = typeof data.linksConfig === "string"
        ? JSON.parse(data.linksConfig)
        : data.linksConfig;
      return normalize(parsed);
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
