import { getPostsFlat } from "@/lib/posts";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TagContent from "./tag-content";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { tag: string };
}): Promise<Metadata> {
  return {
    title: `#${params.tag}`,
    description: `浏览标签「${params.tag}」下的所有文章`,
  };
}

export default async function TagPage({
  params,
}: {
  params: { tag: string };
}) {
  const posts = await getPostsFlat();
  const tag = decodeURIComponent(params.tag);
  const filtered = posts.filter((p) => p.tags.includes(tag));

  if (filtered.length === 0) notFound();

  return <TagContent tag={tag} posts={filtered} />;
}
