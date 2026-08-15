/** Site-level configuration. Change these to customize your blog. */
export const SITE = {
  name: "田",
  description: "关于代码、系统和工程的深度思考",
  tagline: "没有快餐内容 — 只有认真研究的写作。",
  avatar: "田",
  avatarUrl: "",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://tianxinyv.top",
  founded: "2026-03-20",
  keywords: "博客,技术,编程,开发,全栈",
};

/** Generate a cover image URL from picsum using slug as seed */
export function coverImage(slug: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(slug)}/1200/600.webp`;
}

/** Gradient accent colors for hero title */
export const HERO_GRADIENT = {
  from: "#7DCDE8",
  via: "#c084fc",
  to: "#f093fb",
};
