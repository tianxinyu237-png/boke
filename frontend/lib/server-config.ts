import { DEFAULT_SITE, type SiteConfig } from "@/lib/site-config";
import { DEFAULT_THEME, type ThemeColors } from "@/lib/theme";
import { DEFAULT_BG, type BackgroundConfig } from "@/lib/background";

/**
 * 服务端配置聚合: 一次 fetch /api/site-config 拿全 站点/主题/背景 三份配置。
 * 供 layout.tsx (Server Component) 在 SSR 阶段注入 provider,
 * 使 HTML 首帧即渲染最终视觉, 消除"裸版→完整版"闪变。
 */

export interface ServerConfigs {
  siteConfig: SiteConfig;
  themeConfig: ThemeColors;
  bgConfig: BackgroundConfig;
}

export const DEFAULT_CONFIGS: ServerConfigs = {
  siteConfig: DEFAULT_SITE,
  themeConfig: DEFAULT_THEME,
  bgConfig: DEFAULT_BG,
};

/** 服务端(容器内/本机 dev)访问 backend 的 API 基址 */
function resolveServerApi(): string {
  const api = process.env.NEXT_PUBLIC_API_URL || "";
  // 线上 compose 注入 /api → 容器网络直连 backend
  if (api.startsWith("/")) return "http://backend:8080/api";
  // 本机 dev 无注入 → rewrites 目标
  return api || "http://localhost:8080/api";
}

function parseJsonField<T>(
  data: Record<string, unknown> | undefined,
  key: string,
  fallback: T,
  merge: (base: T, parsed: Record<string, unknown>) => T
): T {
  const raw = data?.[key];
  if (!raw) return fallback;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed === "object") return merge(fallback, parsed as Record<string, unknown>);
  } catch {
    /* 解析失败走默认 */
  }
  return fallback;
}

export async function getServerConfigs(): Promise<ServerConfigs> {
  try {
    const res = await fetch(`${resolveServerApi()}/site-config`, {
      cache: "no-store",
      // backend 故障时 3s 超时兜底, 不拖垮所有页面
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return DEFAULT_CONFIGS;
    const data = await res.json();
    return {
      siteConfig: parseJsonField(data, "siteConfig", DEFAULT_SITE, (b, p) => ({ ...b, ...p })),
      themeConfig: parseJsonField(data, "themeConfig", DEFAULT_THEME, (b, p) => ({
        ...b,
        ...p,
        dark: { ...b.dark, ...(p.dark || {}) },
        light: { ...b.light, ...(p.light || {}) },
      })),
      bgConfig: parseJsonField(data, "backgroundConfig", DEFAULT_BG, (b, p) => ({ ...b, ...p })),
    };
  } catch {
    return DEFAULT_CONFIGS;
  }
}
