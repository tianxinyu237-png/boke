import { getPostsFlat } from "@/lib/posts";
import { SITE } from "@/lib/config";

export const revalidate = 3600;

export async function GET() {
  let urls: string[] = [];

  try {
    const posts = await getPostsFlat();
    urls = posts.map(
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
