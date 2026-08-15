import type { Post } from "@/components/post-card";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
// Server-side fetch needs absolute URL in Docker
const SERVER_API = process.env.NEXT_PUBLIC_API_URL?.startsWith("/")
  ? "http://backend:8080/api"
  : API_BASE;
const isServer = typeof window === "undefined";
const API = isServer ? SERVER_API : API_BASE;

export interface PaginatedPosts {
  posts: Post[];
  totalPages: number;
  totalElements: number;
  page: number;
}

export async function getPosts(page = 0, size = 10): Promise<PaginatedPosts> {
  try {
    const res = await fetch(`${API}/posts?page=${page}&size=${size}`, { cache: "no-store",
      ...(isServer ? {} : {}),
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return {
      posts: data.posts ?? data,
      totalPages: data.totalPages ?? 1,
      totalElements: data.totalElements ?? 0,
      page: data.page ?? 0,
    };
  } catch (e) {
    console.error("getPosts failed:", e);
    return { posts: [], totalPages: 0, totalElements: 0, page: 0 };
  }
}

export async function getPostsFlat(): Promise<Post[]> {
  const { posts } = await getPosts(0, 50);
  return posts;
}

export async function getPost(slug: string): Promise<Post & { content: string } | null> {
  try {
    const res = await fetch(`${API}/posts/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getAllTags(): Promise<string[]> {
  const { posts } = await getPosts(0, 50);
  const tags = new Set(posts.flatMap((p) => p.tags));
  return Array.from(tags).sort();
}
