import { putSiteConfig, type SaveResult } from "./config-save";
export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  name: string;
  url?: string;
  desc: string;
  tags: string[];
  stars?: string;
  // 详情页字段(均可选,兼容旧数据)
  slug?: string;
  longDesc?: string;
  features?: string[];
  screenshots?: string[];
  links?: ProjectLink[];
}

export interface ProjectsConfig {
  projects: Project[];
}

export const DEFAULT_PROJECTS: ProjectsConfig = {
  projects: [
    {
      name: "六足机器人 · 18 DOF",
      slug: "hexapod",
      url: "",
      desc: "18 自由度六足机器人：3D 打印结构 + ESP32 + 18 个 MG90S 舵机，三角步态，配手柄遥控与浏览器调试台。进行中",
      tags: ["ESP32", "PCA9685", "Three.js", "嵌入式"],
      stars: "进行中",
      longDesc: [
        "## 这是什么",
        "",
        "一台 18 自由度（每条腿 3 个关节 × 6 条腿）的六足机器人。结构件用开源图纸 3D 打印，主控 ESP32，",
        "两块 PCA9685 输出 18 路 PWM，三角步态行走，PC 手柄经 UDP 遥控。",
        "",
        "## 已完成",
        "",
        "- **结构图纸**：选 `PCrnjak/3D-printed-Hexapod`，全套 29 件，9g 舵机兼容（14 个 STL 已实测边长 / 体积 / 壁厚 / 封闭性）",
        "- **打印适配**：12 件符合嘉立创免费打样限制（单件 ≤100mm、≤70cm³）；机体上下壳 155.8mm 超限，已切成 8 块并修复为水密模型",
        "- **遥控协议**：16 字节定长 UDP 包 @50Hz，带 seq / checksum / flags（急停·换步态·回中），**500ms 丢包自动回站姿**",
        "- **PC 端桥**：XInput 直读手柄 → UDP，实测 50.2Hz、零丢包；带死区与平方曲线",
        "- **浏览器调试台**：三层关节层级 + 相位表步态，18 个舵机角度实时输出，可对照真机刻度",
        "",
        "## 待办",
        "",
        "- 器件到货 → 装 1 条腿 → 卡尺量三段真实长度",
        "- 用实测腿长生成解析 IK 角度表，替换简化步态",
        "- ESP32 固件（查表 + 插值 + 收包）",
        "- 整机标定：中位 90°、每关节方向表、机械限位",
      ].join("\n"),
      features: [
        "18 自由度，每条腿 coxa / femur / tibia 三关节",
        "三角步态：两组腿相位差 180°，任意瞬间 3 条腿撑地",
        "手柄 UDP 遥控，16 字节协议 @50Hz",
        "浏览器实时仿真，角度可直接对照舵机刻度",
      ],
      links: [
        { label: "手柄遥控台", url: "/gamepad" },
        { label: "六足仿真台", url: "/hexapod" },
      ],
    },
    {
      name: "devlog 博客",
      url: "/",
      desc: "基于 Next.js 14 + Spring Boot 3.3 的自建技术博客，支持 Markdown 编辑、代码高亮、粒子动效。",
      tags: ["Next.js", "Spring Boot", "TypeScript"],
      stars: "自建",
    },
    {
      name: "Floating Particles",
      url: "https://github.com",
      desc: "Halo 博客浮动粒子插件，19种粒子效果+13种鼠标特效。",
      tags: ["JavaScript", "Canvas", "Halo"],
    },
  ],
};

const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "/api")
  : "/api";

function normalizeProject(p: any): Project {
  return {
    name: p.name ?? "",
    url: p.url ?? "",
    desc: p.desc ?? p.description ?? "",
    tags: Array.isArray(p.tags) ? p.tags : [],
    stars: p.stars ?? "",
    slug: p.slug ?? "",
    longDesc: p.longDesc ?? p.long_description ?? "",
    features: Array.isArray(p.features) ? p.features : [],
    screenshots: Array.isArray(p.screenshots) ? p.screenshots : [],
    links: Array.isArray(p.links)
      ? p.links.map((l: any) => ({ label: l.label ?? l.name ?? "", url: l.url ?? "" }))
      : [],
  };
}

export async function loadProjectsConfig(): Promise<ProjectsConfig> {
  try {
    const res = await fetch(`${API_BASE}/site-config`);
    if (!res.ok) return DEFAULT_PROJECTS;
    const data = await res.json();
    if (data.projectsConfig) {
      const parsed = typeof data.projectsConfig === "string"
        ? JSON.parse(data.projectsConfig)
        : data.projectsConfig;
      // 兼容两种存储格式:
      //  1) 标准对象格式 { "projects": [...] }
      //  2) 旧版纯数组格式 [ {...}, {...} ] (数据库里遗留的历史数据)
      let list: any[] = [];
      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (parsed && Array.isArray(parsed.projects)) {
        list = parsed.projects;
      }
      if (list.length) {
        return { projects: list.map(normalizeProject) };
      }
    }
  } catch {}
  return DEFAULT_PROJECTS;
}

export async function saveProjectsConfig(config: ProjectsConfig): Promise<SaveResult> {
  return putSiteConfig("projectsConfig", config);
}

/* ------------------------------------------------------------------ *
 * Server-side helpers (used by server components / sitemap).
 * Never import these from a "use client" module.
 * ------------------------------------------------------------------ */

const SERVER_API = "http://backend:8080/api";

export async function loadProjectsConfigServer(): Promise<ProjectsConfig> {
  try {
    const res = await fetch(`${SERVER_API}/site-config`, { next: { revalidate: 300 } });
    if (!res.ok) return DEFAULT_PROJECTS;
    const data = await res.json();
    if (!data.projectsConfig) return DEFAULT_PROJECTS;
    const parsed =
      typeof data.projectsConfig === "string" ? JSON.parse(data.projectsConfig) : data.projectsConfig;
    if (Array.isArray(parsed.projects)) {
      parsed.projects = parsed.projects.map((p: Project & { description?: string }) => ({
        ...p,
        desc: p.desc ?? p.description ?? "",
      }));
    }
    return { ...DEFAULT_PROJECTS, ...parsed };
  } catch {
    return DEFAULT_PROJECTS;
  }
}

export async function getProjectBySlugServer(slug: string): Promise<Project | null> {
  const cfg = await loadProjectsConfigServer();
  return cfg.projects.find((p) => p.slug === slug) ?? null;
}
