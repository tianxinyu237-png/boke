import { getPost, getPostsFlat } from "@/lib/posts";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Post } from "@/components/post-card";
import { renderMarkdown } from "@/lib/highlight";
import { SITE, coverImage } from "@/lib/config";
import { ArticleView } from "./article-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: "Not Found" };

  const imgUrl = post.coverImage || coverImage(post.slug);
  const url = `${SITE.url}/posts/${params.slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
      images: [{ url: imgUrl, width: 1200, height: 600 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [imgUrl],
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const [post, allPosts] = await Promise.all([
    getPost(params.slug),
    getPostsFlat(),
  ]);

  if (!post) notFound();

  const idx = allPosts.findIndex((p) => p.slug === params.slug);
  const prevPost: (Post & { content?: string }) | null =
    idx < allPosts.length - 1 ? { ...allPosts[idx + 1], content: undefined } : null;
  const nextPost: (Post & { content?: string }) | null =
    idx > 0 ? { ...allPosts[idx - 1], content: undefined } : null;

  const highlightedContent = post.content
    ? await renderMarkdown(post.content)
    : "";

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Person", name: SITE.name },
    mainEntityOfPage: `${SITE.url}/posts/${post.slug}`,
    image: post.coverImage || coverImage(post.slug),
    keywords: Array.isArray(post.tags) ? post.tags.join(",") : "",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ArticleView
        post={{ ...post, content: highlightedContent }}
        prevPost={prevPost}
        nextPost={nextPost}
      />
    </>
  );
}
