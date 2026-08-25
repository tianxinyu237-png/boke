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

export async function saveProjectsConfig(config: ProjectsConfig): Promise<boolean> {
  try {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`${API_BASE}/site-config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Api-Key": token } : {}),
      },
      body: JSON.stringify({ projectsConfig: JSON.stringify(config) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
