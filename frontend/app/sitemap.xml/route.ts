import { getPostsFlat } from "@/lib/posts";
import { SITE } from "@/lib/config";

export const revalidate = 3600;

const SERVER_API = process.env.NEXT_PUBLIC_API_URL?.startsWith("/")
  ? "http://backend:8080/api"
  : "http://backend:8080/api";

// Static routes that should always be indexed
const STATIC_PAGES: { path: string; priority: string; freq: string }[] = [
  { path: "", priority: "1.0", freq: "daily" },
  { path: "/projects", priority: "0.9", freq: "weekly" },
  { path: "/resume", priority: "0.9", freq: "weekly" },
  { path: "/about", priority: "0.8", freq: "monthly" },
  { path: "/notes", priority: "0.7", freq: "weekly" },
  { path: "/categories", priority: "0.6", freq: "weekly" },
  { path: "/sum", priority: "0.6", freq: "weekly" },
  { path: "/moments", priority: "0.6", freq: "weekly" },
  { path: "/links", priority: "0.5", freq: "monthly" },
];

async function getProjectSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${SERVER_API}/site-config`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const parsed =
      typeof data.projectsConfig === "string" ? JSON.parse(data.projectsConfig) : data.projectsConfig;
    return (parsed?.projects ?? [])
      .map((p: { slug?: string }) => p.slug)
      .filter((s: string | undefined): s is string => Boolean(s));
  } catch {
    return [];
  }
}

export async function GET() {
  let postUrls: string[] = [];
  let projectUrls: string[] = [];

  try {
    const posts = await getPostsFlat();
    postUrls = posts.map(
      (p) => `  <url>
    <loc>${SITE.url}/posts/${p.slug}</loc>
    <lastmod>${p.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    );
  } catch {
    // empty sitemap if backend unavailable
  }

  const slugs = await getProjectSlugs();
  projectUrls = slugs.map(
    (slug) => `  <url>
    <loc>${SITE.url}/projects/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
  );

  const staticUrls = STATIC_PAGES.map(
    (page) => `  <url>
    <loc>${SITE.url}${page.path}</loc>
    <changefreq>${page.freq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  ).filter((_, i) => i > 0); // home page is emitted separately below

  const urls = [...staticUrls, ...projectUrls, ...postUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE.url}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
