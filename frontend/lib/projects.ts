export interface Project {
  name: string;
  url?: string;
  desc: string;
  tags: string[];
  stars?: string;
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

export async function loadProjectsConfig(): Promise<ProjectsConfig> {
  try {
    const res = await fetch(`${API_BASE}/site-config`);
    if (!res.ok) return DEFAULT_PROJECTS;
    const data = await res.json();
    if (data.projectsConfig) {
      const parsed = typeof data.projectsConfig === "string"
        ? JSON.parse(data.projectsConfig)
        : data.projectsConfig;
      // Normalize: backend may store `description`, frontend uses `desc`
      if (Array.isArray(parsed.projects)) {
        parsed.projects = parsed.projects.map((p: any) => ({
          ...p,
          desc: p.desc ?? p.description ?? "",
        }));
      }
      return { ...DEFAULT_PROJECTS, ...parsed };
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
