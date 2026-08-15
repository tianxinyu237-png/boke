import { getPostsFlat } from "@/lib/posts";
import type { Post } from "@/components/post-card";
import { SITE, coverImage } from "@/lib/config";

const API = "http://backend:8080/api";
export const revalidate = 3600;

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

async function rssItem(post: Post) {
  const url = `${SITE.url}/posts/${post.slug}`;
  const imgUrl = post.coverImage || coverImage(post.slug);

  // Fetch full content for RSS
  let fullContent = post.excerpt;
  try {
    const res = await fetch(`${API}/posts/${post.slug}`, { cache: "no-store" });
    if (res.ok) {
      const full = await res.json();
      fullContent = full.content || post.excerpt;
    }
  } catch {}

  const categories = (post.tags || []).map((t) => `      <category>${escapeXml(t)}</category>`).join("\n");

  return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <content:encoded><![CDATA[${fullContent}]]></content:encoded>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <dc:creator>${escapeXml(SITE.name)}</dc:creator>
      <enclosure url="${escapeXml(imgUrl)}" type="image/jpeg"/>
${categories}
    </item>`;
}

export async function GET() {
  const posts = await getPostsFlat();

  const items = await Promise.all(posts.map(rssItem));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${SITE.name}</title>
    <link>${escapeXml(SITE.url)}</link>
    <atom:link href="${escapeXml(SITE.url)}/rss" rel="self" type="application/rss+xml"/>
    <description>${escapeXml(SITE.description)}。${escapeXml(SITE.tagline)}</description>
    <language>zh-cn</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items.join("\n    ")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
