export interface OneLinerConfig {
  lines: string[];
}

export const DEFAULT_ONE_LINER: OneLinerConfig = {
  lines: [
    "代码写得好,头发少不了。",
    "这个博客还活着,只是更新慢了点。",
    "你来了,网速都变好了。",
    "不要 998,点个收藏带回家。",
    "人生苦短,我用 Python。",
    "Ctrl+S 是程序员的安全感。",
    "在调试生活之前,先给这页点个赞。",
    "深夜写代码的人,运气不会太差。",
    "前端改需求,后端改 bug。",
    "今日份 bug 已清零(大概)。",
    "好奇心是你打开这个博客的原因,也是你按 F12 的原因。",
    "这里没有彩蛋,真的没有。",
    "如果你看到这句话,说明你很有耐心。",
    "别找了,这个博客没有 404 彩蛋。真的。",
    "一按一世界,一码一天堂。",
    "你负责浏览,我负责好看。",
    "关掉电脑,出去走走吧(看完这篇再走)。",
    "收藏夹里吃灰的博客 +1",
    "程序员三大幻觉:明天上线、这次没 bug、再刷五分钟。",
    "本博客支持熬夜阅读(不推荐)。",
    "把 bug 修完的那一刻,值得开瓶快乐水。",
    "世界很大,代码很多,慢慢来。",
  ],
};

const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "/api")
  : "/api";

export async function loadOneLinerConfig(): Promise<OneLinerConfig> {
  try {
    const res = await fetch(`${API_BASE}/site-config`);
    if (!res.ok) return DEFAULT_ONE_LINER;
    const data = await res.json();
    if (data.oneLinerConfig) {
      const parsed = typeof data.oneLinerConfig === "string"
        ? JSON.parse(data.oneLinerConfig)
        : data.oneLinerConfig;
      if (parsed && Array.isArray(parsed.lines) && parsed.lines.length) {
        return {
          lines: parsed.lines.map((s: any) => String(s).trim()).filter(Boolean),
        };
      }
    }
  } catch {}
  return DEFAULT_ONE_LINER;
}

export async function saveOneLinerConfig(config: OneLinerConfig): Promise<boolean> {
  try {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`${API_BASE}/site-config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Api-Key": token } : {}),
      },
      body: JSON.stringify({ oneLinerConfig: JSON.stringify(config) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
