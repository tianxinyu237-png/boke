export interface TechStack {
  name: string;
  desc?: string;
  level?: number;
  category?: string;
}

export interface Contact {
  label: string;
  href?: string;
  url?: string;
  icon?: string;
  type?: string;
}

export interface AboutConfig {
  bio: string;
  techStack: TechStack[];
  contacts: Contact[];
}

export const DEFAULT_ABOUT: AboutConfig = {
  bio: "全栈开发者，专注于后端架构、分布式系统和编程语言设计。这个博客是我记录学习笔记和深度思考的地方。",
  techStack: [
    { name: "Java / Spring Boot", desc: "后端主力" },
    { name: "TypeScript / React", desc: "前端开发" },
    { name: "Next.js", desc: "博客框架" },
    { name: "PostgreSQL / H2", desc: "数据存储" },
    { name: "Rust", desc: "系统编程" },
    { name: "Docker", desc: "容器化部署" },
  ],
  contacts: [
    { label: "GitHub", href: "https://github.com", icon: "github" },
    { label: "Email", href: "mailto:hello@example.com", icon: "email" },
    { label: "RSS", href: "/rss", icon: "rss" },
  ],
};

const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "/api")
  : "/api";

export async function loadAboutConfig(): Promise<AboutConfig> {
  try {
    const res = await fetch(`${API_BASE}/site-config`);
    if (!res.ok) return DEFAULT_ABOUT;
    const data = await res.json();
    if (data.aboutConfig) {
      const parsed = typeof data.aboutConfig === "string"
        ? JSON.parse(data.aboutConfig)
        : data.aboutConfig;
      return {
        ...DEFAULT_ABOUT,
        ...parsed,
        bio: parsed.bio || DEFAULT_ABOUT.bio,
        // 服务器数据兼容: techStack 可能是 {name, level, category}, contacts 可能是 {type, url, label}
        techStack: Array.isArray(parsed.techStack)
          ? parsed.techStack.map((t: { name?: string; desc?: string; category?: string }) => ({
              name: t.name || "?",
              desc: t.desc || t.category || "",
            }))
          : DEFAULT_ABOUT.techStack,
        contacts: Array.isArray(parsed.contacts)
          ? parsed.contacts.map((c: { label?: string; type?: string; href?: string; url?: string; icon?: string }) => ({
              label: c.label || c.type || "链接",
              href: c.href || c.url || "",
              icon: c.icon || c.type || "",
            }))
          : DEFAULT_ABOUT.contacts,
      };
    }
  } catch {}
  return DEFAULT_ABOUT;
}

export async function saveAboutConfig(config: AboutConfig): Promise<boolean> {
  try {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`${API_BASE}/site-config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Api-Key": token } : {}),
      },
      body: JSON.stringify({ aboutConfig: JSON.stringify(config) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
