import { getPostsFlat } from "@/lib/posts";
import type { Metadata } from "next";
import ArchiveContent from "./archive-content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "归档",
  description: "全部文章归档列表",
};

export default async function ArchivePage() {
  const posts = await getPostsFlat();
  return <ArchiveContent posts={posts} />;
}
