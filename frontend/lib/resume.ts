export interface ResumeEducation {
  period?: string;
  org?: string;
  title?: string;
  desc?: string;
}

export interface ResumeConfig {
  headline: string;
  bio?: string;
  education: ResumeEducation[];
  ctaTitle: string;
  ctaDesc: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export const DEFAULT_RESUME: ResumeConfig = {
  headline: "全能开发程序员",
  bio: "",
  education: [],
  ctaTitle: "想了解更多?",
  ctaDesc: "看项目细节、技术笔记和完整博客",
  ctaPrimary: "项目作品集",
  ctaSecondary: "回博客首页",
};

const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "/api")
  : "/api";

export async function loadResumeConfig(): Promise<ResumeConfig> {
  try {
    const res = await fetch(`${API_BASE}/site-config`);
    if (!res.ok) return DEFAULT_RESUME;
    const data = await res.json();
    if (data.resumeConfig) {
      const parsed = typeof data.resumeConfig === "string"
        ? JSON.parse(data.resumeConfig)
        : data.resumeConfig;
      return { ...DEFAULT_RESUME, ...parsed };
    }
  } catch {}
  return DEFAULT_RESUME;
}

export async function saveResumeConfig(config: ResumeConfig): Promise<boolean> {
  try {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`${API_BASE}/site-config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Api-Key": token } : {}),
      },
      body: JSON.stringify({ resumeConfig: JSON.stringify(config) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
